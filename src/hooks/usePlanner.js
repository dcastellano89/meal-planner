import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { getWeekStart } from '../utils/portions'

const ALL_DAYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
const DEFAULT_ACTIVE_DAYS = ['lun', 'mar', 'mie', 'jue', 'vie']

const emptySlots = () => {
  const s = {}
  ALL_DAYS.forEach((d) => { s[d] = { lunch: null, dinner: null } })
  return s
}

export default function usePlanner(householdId, activeDays = DEFAULT_ACTIVE_DAYS) {
  const [planId, setPlanId] = useState(null)
  const [slots, setSlots] = useState(emptySlots())
  const [extras, setExtras] = useState([])
  const [loading, setLoading] = useState(true)

  const weekStart = getWeekStart()

  const fetchPlan = useCallback(async () => {
    setLoading(true)

    // Obtener o crear el plan de esta semana
    let { data: plan } = await supabase
      .from('weekly_plans')
      .select('id')
      .eq('household_id', householdId)
      .eq('week_start', weekStart)
      .maybeSingle()

    if (!plan) {
      const { data: newPlan, error } = await supabase
        .from('weekly_plans')
        .insert({ household_id: householdId, week_start: weekStart })
        .select()
        .single()
      if (error) { setLoading(false); return }
      plan = newPlan
    }

    setPlanId(plan.id)

    // Cargar los slots con datos de la receta
    const { data: slotRows } = await supabase
      .from('plan_slots')
      .select('day, meal_type, recipe_id, recipes(id, name, emoji, portions, category)')
      .eq('plan_id', plan.id)

    const built = emptySlots()
    ;(slotRows || []).forEach(({ day, meal_type, recipes: recipe }) => {
      if (built[day]) built[day][meal_type] = recipe || null
    })
    setSlots(built)

    // Cargar extras (postres/snacks de la semana)
    const { data: extraRows } = await supabase
      .from('plan_extras')
      .select('recipe_id, recipes(id, name, emoji, portions, category)')
      .eq('plan_id', plan.id)

    setExtras((extraRows || []).map(({ recipes: r }) => r).filter(Boolean))

    setLoading(false)
    return plan.id
  }, [householdId, weekStart])

  useEffect(() => {
    if (householdId) fetchPlan()
  }, [fetchPlan, householdId])

  // Realtime: escuchar cambios de otros miembros
  useEffect(() => {
    if (!planId) return
    const channel = supabase
      .channel(`plan-${planId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'plan_slots',
        filter: `plan_id=eq.${planId}`,
      }, () => { fetchPlan() })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'plan_extras',
        filter: `plan_id=eq.${planId}`,
      }, () => { fetchPlan() })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [planId, fetchPlan])

  const updateSlot = async (day, mealType, recipe) => {
    if (!planId) return

    // Optimistic update
    setSlots((prev) => ({
      ...prev,
      [day]: { ...prev[day], [mealType]: recipe },
    }))

    if (recipe) {
      await supabase.from('plan_slots').upsert(
        { plan_id: planId, day, meal_type: mealType, recipe_id: recipe.id },
        { onConflict: 'plan_id,day,meal_type' }
      )
    } else {
      await supabase.from('plan_slots')
        .delete()
        .eq('plan_id', planId)
        .eq('day', day)
        .eq('meal_type', mealType)
    }
  }

  const applyGeneratedPlan = async (generatedPlan, recipes) => {
    if (!planId) return

    // Borrar slots actuales
    await supabase.from('plan_slots').delete().eq('plan_id', planId)

    // Insertar los nuevos (solo días activos)
    const rows = []
    activeDays.forEach((day) => {
      ;['lunch', 'dinner'].forEach((mealType) => {
        const recipeId = generatedPlan[day]?.[mealType]
        if (recipeId) {
          rows.push({ plan_id: planId, day, meal_type: mealType, recipe_id: recipeId })
        }
      })
    })

    if (rows.length) {
      await supabase.from('plan_slots').insert(rows)
    }

    // Aplicar extras generados por la IA (si los hay)
    if (generatedPlan.extras?.length) {
      await supabase.from('plan_extras').delete().eq('plan_id', planId)
      const extraRows = generatedPlan.extras.map((recipeId) => ({ plan_id: planId, recipe_id: recipeId }))
      await supabase.from('plan_extras').insert(extraRows)
    }

    await fetchPlan()
  }

  const addExtra = async (recipe) => {
    if (!planId) return
    if (extras.some((e) => e.id === recipe.id)) return
    setExtras((prev) => [...prev, recipe])
    await supabase.from('plan_extras').upsert(
      { plan_id: planId, recipe_id: recipe.id },
      { onConflict: 'plan_id,recipe_id' }
    )
  }

  const removeExtra = async (recipeId) => {
    if (!planId) return
    setExtras((prev) => prev.filter((e) => e.id !== recipeId))
    await supabase.from('plan_extras').delete()
      .eq('plan_id', planId)
      .eq('recipe_id', recipeId)
  }

  const clearPlan = async () => {
    if (!planId) return
    await supabase.from('plan_slots').delete().eq('plan_id', planId)
    await supabase.from('plan_extras').delete().eq('plan_id', planId)
    setSlots(emptySlots())
    setExtras([])
  }

  const hasAnySlot = Object.values(slots).some((d) => d.lunch || d.dinner)

  const activeSlots = activeDays.map((d) => slots[d] || { lunch: null, dinner: null })
  const planned = activeSlots.reduce((acc, d) => acc + (d.lunch ? 1 : 0) + (d.dinner ? 1 : 0), 0)
  const stats = {
    planned,
    empty: activeDays.length * 2 - planned,
    recipes: new Set([
      ...activeSlots.map((d) => d.lunch?.id),
      ...activeSlots.map((d) => d.dinner?.id),
    ].filter(Boolean)).size,
  }

  return { planId, slots, extras, loading, hasAnySlot, stats, weekStart, updateSlot, applyGeneratedPlan, addExtra, removeExtra, clearPlan }
}
