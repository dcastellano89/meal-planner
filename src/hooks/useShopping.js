import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { getWeekStart } from '../utils/portions'
import { buildShoppingList } from '../utils/shopping'

export default function useShopping(householdId) {
  const [planId, setPlanId] = useState(null)
  const [shoppingList, setShoppingList] = useState({})
  const [loading, setLoading] = useState(true)

  const weekStart = getWeekStart()

  const fetchShopping = useCallback(async () => {
    setLoading(true)

    // Buscar el plan de esta semana
    const { data: plan } = await supabase
      .from('weekly_plans')
      .select('id')
      .eq('household_id', householdId)
      .eq('week_start', weekStart)
      .maybeSingle()

    if (!plan) {
      setPlanId(null)
      setShoppingList({})
      setLoading(false)
      return
    }

    setPlanId(plan.id)

    // Obtener slots del plan
    const { data: slots } = await supabase
      .from('plan_slots')
      .select('recipe_id')
      .eq('plan_id', plan.id)

    const recipeIds = [...new Set((slots || []).map((s) => s.recipe_id).filter(Boolean))]

    if (recipeIds.length === 0) {
      setShoppingList({})
      setLoading(false)
      return
    }

    // Obtener recetas con ingredientes
    const { data: recipes } = await supabase
      .from('recipes')
      .select('id, ingredients(name, quantity, sort_order)')
      .in('id', recipeIds)

    // Construir lista de compras (deduplicada)
    const list = buildShoppingList(slots || [], recipes || [])

    // Cargar estados de tildado
    const { data: checkedItems } = await supabase
      .from('shopping_items')
      .select('ingredient_name, checked')
      .eq('plan_id', plan.id)

    const checkedMap = {}
    ;(checkedItems || []).forEach((item) => {
      checkedMap[item.ingredient_name.toLowerCase()] = item.checked
    })

    // Combinar lista con estado de tildado
    const merged = {}
    Object.entries(list).forEach(([cat, items]) => {
      merged[cat] = items.map((item) => ({
        ...item,
        checked: checkedMap[item.name.toLowerCase()] ?? false,
      }))
    })

    setShoppingList(merged)
    setLoading(false)
  }, [householdId, weekStart])

  useEffect(() => {
    if (householdId) fetchShopping()
  }, [fetchShopping, householdId])

  // Realtime: sincronizar con otros miembros del hogar
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

    // Actualización optimista
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
      {
        plan_id: planId,
        ingredient_name: item.name,
        quantity: item.quantity || '',
        category,
        checked: !currentChecked,
      },
      { onConflict: 'plan_id,ingredient_name' }
    )
  }

  const clearChecked = async () => {
    if (!planId) return

    // Optimistic
    setShoppingList((prev) => {
      const updated = {}
      Object.entries(prev).forEach(([cat, items]) => {
        updated[cat] = items.map((item) => ({ ...item, checked: false }))
      })
      return updated
    })

    await supabase
      .from('shopping_items')
      .delete()
      .eq('plan_id', planId)
  }

  const totalItems = Object.values(shoppingList).reduce((acc, items) => acc + items.length, 0)
  const checkedCount = Object.values(shoppingList).reduce(
    (acc, items) => acc + items.filter((i) => i.checked).length, 0
  )

  return {
    shoppingList,
    loading,
    hasPlan: planId !== null,
    totalItems,
    checkedCount,
    toggleItem,
    clearChecked,
    refresh: fetchShopping,
  }
}
