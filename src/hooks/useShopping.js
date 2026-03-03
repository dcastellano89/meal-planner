import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { getWeekStart } from '../utils/portions'
import { buildShoppingList } from '../utils/shopping'

export default function useShopping(householdId) {
  const [planId, setPlanId] = useState(null)
  const [shoppingList, setShoppingList] = useState({})
  const [extras, setExtras] = useState([])
  const [loading, setLoading] = useState(true)

  const weekStart = getWeekStart()

  const fetchShopping = useCallback(async () => {
    setLoading(true)

    const { data: plan } = await supabase
      .from('weekly_plans')
      .select('id')
      .eq('household_id', householdId)
      .eq('week_start', weekStart)
      .maybeSingle()

    if (!plan) {
      setPlanId(null)
      setShoppingList({})
      setExtras([])
      setLoading(false)
      return
    }

    setPlanId(plan.id)

    // Slots del plan
    const { data: slots } = await supabase
      .from('plan_slots')
      .select('recipe_id')
      .eq('plan_id', plan.id)

    const recipeIds = [...new Set((slots || []).map((s) => s.recipe_id).filter(Boolean))]

    // Recetas con ingredientes
    const recipes = recipeIds.length > 0
      ? (await supabase.from('recipes').select('id, ingredients(name, quantity, sort_order)').in('id', recipeIds)).data || []
      : []

    // Lista de compras de recetas
    const list = buildShoppingList(slots || [], recipes)

    // Estados de tildado (solo ítems de recetas)
    const { data: checkedItems } = await supabase
      .from('shopping_items')
      .select('ingredient_name, checked')
      .eq('plan_id', plan.id)
      .eq('is_manual', false)

    const checkedMap = {}
    ;(checkedItems || []).forEach((item) => {
      checkedMap[item.ingredient_name.toLowerCase()] = item.checked
    })

    const merged = {}
    Object.entries(list).forEach(([cat, items]) => {
      merged[cat] = items.map((item) => ({
        ...item,
        checked: checkedMap[item.name.toLowerCase()] ?? false,
      }))
    })
    setShoppingList(merged)

    // Extras manuales
    const { data: extraItems } = await supabase
      .from('shopping_items')
      .select('ingredient_name, quantity, checked')
      .eq('plan_id', plan.id)
      .eq('is_manual', true)
      .order('ingredient_name')

    setExtras((extraItems || []).map((e) => ({
      name: e.ingredient_name,
      quantity: e.quantity || '',
      checked: e.checked,
    })))

    setLoading(false)
  }, [householdId, weekStart])

  useEffect(() => {
    if (householdId) fetchShopping()
  }, [fetchShopping, householdId])

  // Realtime
  useEffect(() => {
    if (!planId) return
    const channel = supabase
      .channel(`shopping-${planId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shopping_items',
        filter: `plan_id=eq.${planId}`,
      }, () => { fetchShopping() })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [planId, fetchShopping])

  const toggleItem = async (item, category, currentChecked) => {
    if (!planId) return
    setShoppingList((prev) => {
      const updated = {}
      Object.entries(prev).forEach(([cat, items]) => {
        updated[cat] = items.map((i) =>
          i.name === item.name ? { ...i, checked: !currentChecked } : i
        )
      })
      return updated
    })
    await supabase.from('shopping_items').upsert(
      { plan_id: planId, ingredient_name: item.name, quantity: item.quantity || '', category, checked: !currentChecked, is_manual: false },
      { onConflict: 'plan_id,ingredient_name,is_manual' }
    )
  }

  const addExtra = async (name, quantity = '') => {
    if (!planId || !name.trim()) return
    const trimmed = name.trim()
    if (extras.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())) return
    setExtras((prev) => [...prev, { name: trimmed, quantity, checked: false }])
    await supabase.from('shopping_items').upsert(
      { plan_id: planId, ingredient_name: trimmed, quantity, category: 'extras', checked: false, is_manual: true },
      { onConflict: 'plan_id,ingredient_name,is_manual' }
    )
  }

  const removeExtra = async (name) => {
    if (!planId) return
    setExtras((prev) => prev.filter((e) => e.name !== name))
    await supabase.from('shopping_items').delete()
      .eq('plan_id', planId)
      .eq('ingredient_name', name)
      .eq('is_manual', true)
  }

  const toggleExtra = async (name, currentChecked) => {
    if (!planId) return
    setExtras((prev) => prev.map((e) => e.name === name ? { ...e, checked: !currentChecked } : e))
    await supabase.from('shopping_items').update({ checked: !currentChecked })
      .eq('plan_id', planId)
      .eq('ingredient_name', name)
      .eq('is_manual', true)
  }

  const clearChecked = async () => {
    if (!planId) return
    setShoppingList((prev) => {
      const updated = {}
      Object.entries(prev).forEach(([cat, items]) => {
        updated[cat] = items.map((item) => ({ ...item, checked: false }))
      })
      return updated
    })
    setExtras((prev) => prev.map((e) => ({ ...e, checked: false })))
    // Borrar check states de recetas
    await supabase.from('shopping_items').delete().eq('plan_id', planId).eq('is_manual', false)
    // Desmarcar extras (sin borrarlos)
    await supabase.from('shopping_items').update({ checked: false }).eq('plan_id', planId).eq('is_manual', true)
  }

  const totalItems = Object.values(shoppingList).reduce((acc, items) => acc + items.length, 0) + extras.length
  const checkedCount = Object.values(shoppingList).reduce(
    (acc, items) => acc + items.filter((i) => i.checked).length, 0
  ) + extras.filter((e) => e.checked).length

  return {
    shoppingList,
    extras,
    loading,
    hasPlan: planId !== null,
    totalItems,
    checkedCount,
    toggleItem,
    addExtra,
    removeExtra,
    toggleExtra,
    clearChecked,
    refresh: fetchShopping,
  }
}
