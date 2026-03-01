import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'

export default function useRecipes(householdId) {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRecipes = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recipes')
      .select('*, ingredients(id, name, quantity, sort_order)')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setRecipes(data || [])
    setLoading(false)
  }, [householdId])

  useEffect(() => {
    if (householdId) fetchRecipes()
  }, [fetchRecipes, householdId])

  const createRecipe = async ({ name, portions, emoji, category, tags, ingredients, procedure }) => {
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({ household_id: householdId, name, portions, emoji, category, tags, procedure: procedure || null })
      .select()
      .single()

    if (recipeError) throw recipeError

    if (ingredients?.length) {
      const rows = ingredients
        .filter((i) => i.name?.trim())
        .map((i, idx) => ({
          recipe_id: recipe.id,
          name: i.name.trim(),
          quantity: i.quantity?.trim() || '',
          sort_order: idx,
        }))
      const { error: ingError } = await supabase.from('ingredients').insert(rows)
      if (ingError) throw ingError
    }

    await fetchRecipes()
    return recipe
  }

  const updateRecipe = async (id, { name, portions, emoji, category, tags, ingredients, procedure }) => {
    const { error: recipeError } = await supabase
      .from('recipes')
      .update({ name, portions, emoji, category, tags, procedure: procedure || null })
      .eq('id', id)

    if (recipeError) throw recipeError

    if (ingredients) {
      await supabase.from('ingredients').delete().eq('recipe_id', id)
      const rows = ingredients
        .filter((i) => i.name?.trim())
        .map((i, idx) => ({
          recipe_id: id,
          name: i.name.trim(),
          quantity: i.quantity?.trim() || '',
          sort_order: idx,
        }))
      if (rows.length) {
        const { error: ingError } = await supabase.from('ingredients').insert(rows)
        if (ingError) throw ingError
      }
    }

    await fetchRecipes()
  }

  const deleteRecipe = async (id) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) throw error
    setRecipes((prev) => prev.filter((r) => r.id !== id))
  }

  return { recipes, loading, error, createRecipe, updateRecipe, deleteRecipe, refetch: fetchRecipes }
}
