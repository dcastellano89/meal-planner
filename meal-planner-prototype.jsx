import { useState } from "react";

const COLORS = {
  bg: "#FAFAF7",
  card: "#FFFFFF",
  primary: "#2D5016",
  primaryLight: "#4A7C28",
  accent: "#E8F5D0",
  accentDark: "#C5E89A",
  text: "#1A1A1A",
  textMuted: "#6B7280",
  border: "#E8EDE0",
  error: "#DC2626",
  warning: "#D97706",
  success: "#16A34A",
  orange: "#EA580C",
};

const FONTS = {
  display: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${COLORS.bg}; font-family: ${FONTS.body}; }
  
  .app { max-width: 390px; margin: 0 auto; min-height: 100vh; position: relative; background: ${COLORS.bg}; display: flex; flex-direction: column; }
  
  .screen { flex: 1; overflow-y: auto; padding-bottom: 80px; }
  
  .bottom-nav { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 390px; background: white; border-top: 1px solid ${COLORS.border}; display: flex; z-index: 100; padding: 8px 0 16px; }
  
  .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; padding: 4px; }
  .nav-item .nav-icon { font-size: 22px; }
  .nav-item .nav-label { font-size: 10px; font-weight: 500; color: ${COLORS.textMuted}; font-family: ${FONTS.body}; }
  .nav-item.active .nav-label { color: ${COLORS.primary}; }
  .nav-item.active .nav-icon { filter: none; }

  .header { padding: 20px 20px 12px; background: ${COLORS.bg}; }
  .header-title { font-family: ${FONTS.display}; font-size: 26px; color: ${COLORS.text}; font-weight: 700; line-height: 1.2; }
  .header-subtitle { font-size: 13px; color: ${COLORS.textMuted}; margin-top: 4px; }

  .section-pad { padding: 0 20px; }

  .card { background: white; border-radius: 16px; border: 1px solid ${COLORS.border}; overflow: hidden; }
  .card-pad { padding: 16px; }

  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer; font-family: ${FONTS.body}; font-weight: 600; border-radius: 12px; transition: all 0.15s; }
  .btn-primary { background: ${COLORS.primary}; color: white; padding: 14px 20px; font-size: 15px; width: 100%; }
  .btn-primary:active { background: ${COLORS.primaryLight}; transform: scale(0.98); }
  .btn-secondary { background: ${COLORS.accent}; color: ${COLORS.primary}; padding: 10px 16px; font-size: 14px; }
  .btn-ghost { background: transparent; color: ${COLORS.primary}; padding: 10px 16px; font-size: 14px; border: 1.5px solid ${COLORS.accentDark}; }
  .btn-sm { padding: 8px 14px; font-size: 13px; border-radius: 10px; }
  .btn-danger { background: #FEE2E2; color: ${COLORS.error}; padding: 10px 16px; font-size: 14px; }

  .tag { display: inline-flex; align-items: center; background: ${COLORS.accent}; color: ${COLORS.primary}; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; }

  .recipe-card { background: white; border-radius: 16px; border: 1px solid ${COLORS.border}; padding: 14px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.15s; }
  .recipe-card:active { transform: scale(0.98); background: ${COLORS.accent}; }
  .recipe-emoji { font-size: 32px; width: 50px; height: 50px; background: ${COLORS.accent}; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .recipe-info { flex: 1; min-width: 0; }
  .recipe-name { font-weight: 600; font-size: 15px; color: ${COLORS.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .recipe-meta { font-size: 12px; color: ${COLORS.textMuted}; margin-top: 3px; }

  .week-grid { display: grid; gap: 8px; }
  .day-row { background: white; border-radius: 14px; border: 1px solid ${COLORS.border}; overflow: hidden; }
  .day-header { background: ${COLORS.accent}; padding: 8px 14px; font-size: 12px; font-weight: 700; color: ${COLORS.primary}; text-transform: uppercase; letter-spacing: 0.5px; }
  .meal-slots { display: grid; grid-template-columns: 1fr 1fr; }
  .meal-slot { padding: 10px 14px; cursor: pointer; transition: background 0.15s; border-right: 1px solid ${COLORS.border}; }
  .meal-slot:last-child { border-right: none; }
  .meal-slot:active { background: ${COLORS.accent}; }
  .slot-label { font-size: 10px; font-weight: 700; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .slot-recipe { font-size: 13px; font-weight: 500; color: ${COLORS.text}; line-height: 1.3; }
  .slot-empty { font-size: 13px; color: ${COLORS.textMuted}; font-style: italic; }
  .slot-portions { font-size: 10px; color: ${COLORS.primaryLight}; margin-top: 2px; font-weight: 600; }

  .shopping-category { margin-bottom: 20px; }
  .category-title { font-size: 12px; font-weight: 700; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; padding: 0 4px; }
  .shopping-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: white; border-radius: 12px; border: 1px solid ${COLORS.border}; margin-bottom: 8px; cursor: pointer; transition: all 0.15s; }
  .shopping-item.checked { opacity: 0.5; }
  .shopping-item.checked .item-name { text-decoration: line-through; color: ${COLORS.textMuted}; }
  .check-circle { width: 22px; height: 22px; border-radius: 50%; border: 2px solid ${COLORS.border}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .check-circle.done { background: ${COLORS.success}; border-color: ${COLORS.success}; }
  .item-name { font-size: 14px; font-weight: 500; color: ${COLORS.text}; flex: 1; }
  .item-qty { font-size: 13px; color: ${COLORS.textMuted}; font-weight: 400; }

  .input-field { width: 100%; border: 1.5px solid ${COLORS.border}; border-radius: 12px; padding: 12px 14px; font-size: 15px; font-family: ${FONTS.body}; color: ${COLORS.text}; background: white; outline: none; transition: border 0.15s; }
  .input-field:focus { border-color: ${COLORS.primaryLight}; }
  .input-label { font-size: 13px; font-weight: 600; color: ${COLORS.text}; margin-bottom: 6px; display: block; }
  .input-group { margin-bottom: 16px; }

  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
  .modal { background: white; border-radius: 24px 24px 0 0; width: 390px; max-height: 85vh; overflow-y: auto; padding: 24px 20px 40px; }
  .modal-handle { width: 40px; height: 4px; background: ${COLORS.border}; border-radius: 4px; margin: 0 auto 20px; }
  .modal-title { font-family: ${FONTS.display}; font-size: 22px; font-weight: 700; color: ${COLORS.text}; margin-bottom: 20px; }

  .empty-state { text-align: center; padding: 48px 24px; }
  .empty-icon { font-size: 56px; margin-bottom: 16px; }
  .empty-title { font-family: ${FONTS.display}; font-size: 20px; color: ${COLORS.text}; margin-bottom: 8px; }
  .empty-text { font-size: 14px; color: ${COLORS.textMuted}; line-height: 1.6; margin-bottom: 24px; }

  .badge { display: inline-flex; align-items: center; justify-content: center; background: ${COLORS.orange}; color: white; font-size: 10px; font-weight: 700; width: 18px; height: 18px; border-radius: 50%; position: absolute; top: 2px; right: 2px; }

  .onboarding { padding: 40px 24px; display: flex; flex-direction: column; min-height: 100vh; background: ${COLORS.bg}; }
  .onboard-logo { font-family: ${FONTS.display}; font-size: 36px; font-weight: 700; color: ${COLORS.primary}; margin-bottom: 8px; }
  .onboard-tagline { font-size: 16px; color: ${COLORS.textMuted}; margin-bottom: 48px; line-height: 1.5; }
  .onboard-illustration { font-size: 80px; text-align: center; margin-bottom: 40px; }

  .member-row { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid ${COLORS.border}; }
  .avatar { width: 40px; height: 40px; border-radius: 50%; background: ${COLORS.accent}; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .member-info { flex: 1; }
  .member-name { font-weight: 600; font-size: 14px; color: ${COLORS.text}; }
  .member-role { font-size: 12px; color: ${COLORS.textMuted}; }

  .divider { height: 1px; background: ${COLORS.border}; margin: 16px 0; }

  .pill-tabs { display: flex; gap: 8px; padding: 16px 20px 0; overflow-x: auto; }
  .pill-tab { flex-shrink: 0; padding: 7px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid ${COLORS.border}; background: white; color: ${COLORS.textMuted}; }
  .pill-tab.active { background: ${COLORS.primary}; color: white; border-color: ${COLORS.primary}; }

  .fab { position: fixed; bottom: 90px; right: calc(50% - 195px + 16px); width: 52px; height: 52px; background: ${COLORS.primary}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; cursor: pointer; box-shadow: 0 4px 16px rgba(45,80,22,0.35); z-index: 50; border: none; transition: transform 0.15s; }
  .fab:active { transform: scale(0.92); }

  .progress-bar { height: 4px; background: ${COLORS.border}; border-radius: 4px; margin-bottom: 24px; }
  .progress-fill { height: 100%; background: ${COLORS.primary}; border-radius: 4px; transition: width 0.3s; }

  .suggest-banner { background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight}); border-radius: 16px; padding: 16px; margin: 16px 20px; color: white; display: flex; align-items: center; gap: 12px; cursor: pointer; }
  .suggest-text { flex: 1; }
  .suggest-title { font-weight: 700; font-size: 15px; margin-bottom: 2px; }
  .suggest-sub { font-size: 12px; opacity: 0.8; }

  .stat-row { display: flex; gap: 12px; padding: 0 20px 16px; }
  .stat-card { flex: 1; background: white; border-radius: 14px; border: 1px solid ${COLORS.border}; padding: 14px; text-align: center; }
  .stat-num { font-family: ${FONTS.display}; font-size: 28px; font-weight: 700; color: ${COLORS.primary}; }
  .stat-label { font-size: 11px; color: ${COLORS.textMuted}; margin-top: 2px; }
`;

// ── DATA ──────────────────────────────────────────────────────────────────────

const INITIAL_RECIPES = [
  { id: 1, name: "Pollo al horno", portions: 3, emoji: "🍗", tags: ["con pollo"], ingredients: [{ name: "Pollo entero", qty: "1.2kg" }, { name: "Papas", qty: "4 unidades" }, { name: "Ajo", qty: "4 dientes" }, { name: "Aceite de oliva", qty: "3 cdas" }, { name: "Romero", qty: "c/n" }] },
  { id: 2, name: "Fideos con atún", portions: 2, emoji: "🍝", tags: ["rápido"], ingredients: [{ name: "Fideos", qty: "200g" }, { name: "Atún en lata", qty: "2 latas" }, { name: "Tomates cherry", qty: "200g" }, { name: "Ajo", qty: "2 dientes" }, { name: "Aceite de oliva", qty: "2 cdas" }] },
  { id: 3, name: "Lentejas guisadas", portions: 4, emoji: "🫘", tags: ["vegetariano"], ingredients: [{ name: "Lentejas", qty: "300g" }, { name: "Zanahoria", qty: "2 unidades" }, { name: "Cebolla", qty: "1 unidad" }, { name: "Tomate triturado", qty: "400g" }, { name: "Pimentón", qty: "1 cdita" }] },
  { id: 4, name: "Tortilla de papas", portions: 2, emoji: "🥚", tags: ["rápido", "vegetariano"], ingredients: [{ name: "Papas", qty: "3 unidades" }, { name: "Huevos", qty: "4 unidades" }, { name: "Cebolla", qty: "1 unidad" }, { name: "Aceite", qty: "100ml" }, { name: "Sal", qty: "c/n" }] },
  { id: 5, name: "Milanesas con ensalada", portions: 2, emoji: "🥩", tags: ["con carne"], ingredients: [{ name: "Milanesas de ternera", qty: "400g" }, { name: "Pan rallado", qty: "1 taza" }, { name: "Huevos", qty: "2 unidades" }, { name: "Lechuga", qty: "1 planta" }, { name: "Tomate", qty: "2 unidades" }] },
];

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAYS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const buildInitialPlan = (recipes) => {
  const plan = {};
  DAYS.forEach(d => { plan[d] = { lunch: null, dinner: null }; });
  // Pollo: 3 porciones → 3 slots
  plan["Lun"].lunch = recipes[0];
  plan["Mié"].dinner = recipes[0];
  plan["Vie"].lunch = recipes[0];
  // Fideos: 2 porciones
  plan["Lun"].dinner = recipes[1];
  plan["Mar"].lunch = recipes[1];
  // Lentejas: 4 porciones
  plan["Mar"].dinner = recipes[2];
  plan["Jue"].lunch = recipes[2];
  plan["Jue"].dinner = recipes[2];
  plan["Sáb"].lunch = recipes[2];
  // Tortilla: 2 porciones
  plan["Mié"].lunch = recipes[3];
  plan["Dom"].lunch = recipes[3];
  // Milanesas: 2 porciones
  plan["Vie"].dinner = recipes[4];
  plan["Sáb"].dinner = recipes[4];
  return plan;
};

const buildShoppingList = (plan, recipes) => {
  const usedRecipes = new Set();
  Object.values(plan).forEach(day => {
    if (day.lunch) usedRecipes.add(day.lunch.id);
    if (day.dinner) usedRecipes.add(day.dinner.id);
  });
  const ingredientMap = {};
  recipes.filter(r => usedRecipes.has(r.id)).forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      const key = ing.name.toLowerCase();
      if (!ingredientMap[key]) ingredientMap[key] = { name: ing.name, qty: ing.qty, checked: false };
    });
  });
  const categories = {
    "🥬 Verduras y Frutas": [],
    "🥩 Carnes y Pescados": [],
    "🥚 Lácteos y Huevos": [],
    "🫙 Almacén": [],
    "🧂 Otros": [],
  };
  const vegKeywords = ["papa", "tomate", "cebolla", "lechuga", "zanahoria", "ajo", "romero", "pimentón"];
  const meatKeywords = ["pollo", "ternera", "milanesa", "atún", "pescado", "carne"];
  const dairyKeywords = ["huevo", "leche", "queso", "manteca", "crema"];
  const pantryKeywords = ["fideo", "arroz", "lenteja", "harina", "aceite", "pan rallado", "tomate triturado"];

  Object.values(ingredientMap).forEach(item => {
    const n = item.name.toLowerCase();
    if (vegKeywords.some(k => n.includes(k))) categories["🥬 Verduras y Frutas"].push(item);
    else if (meatKeywords.some(k => n.includes(k))) categories["🥩 Carnes y Pescados"].push(item);
    else if (dairyKeywords.some(k => n.includes(k))) categories["🥚 Lácteos y Huevos"].push(item);
    else if (pantryKeywords.some(k => n.includes(k))) categories["🫙 Almacén"].push(item);
    else categories["🧂 Otros"].push(item);
  });
  return categories;
};

// ── SCREENS ───────────────────────────────────────────────────────────────────

function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);
  const [householdName, setHouseholdName] = useState("Casa de Ana y Carlos");
  const [persons, setPersons] = useState(2);

  const steps = [
    {
      title: "Tu cocina, organizada",
      content: (
        <>
          <div className="onboard-illustration">🍽️</div>
          <div style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 700, color: COLORS.text, marginBottom: 12, lineHeight: 1.3 }}>Planificá tus comidas semanales en minutos</div>
          <p style={{ fontSize: 15, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 32 }}>Tus recetas, tu calendario semanal y la lista de compras, todo en un lugar.</p>
          <button className="btn btn-primary" onClick={() => setStep(1)}>Empezar →</button>
        </>
      )
    },
    {
      title: "Creá tu hogar",
      content: (
        <>
          <div className="onboard-illustration">🏠</div>
          <div style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>¿Cómo se llama tu hogar?</div>
          <p style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 24, lineHeight: 1.5 }}>Vas a poder compartirlo con tu pareja o familia para planificar juntos.</p>
          <div className="input-group">
            <label className="input-label">Nombre del hogar</label>
            <input className="input-field" value={householdName} onChange={e => setHouseholdName(e.target.value)} />
          </div>
          <div className="input-group" style={{ marginBottom: 32 }}>
            <label className="input-label">¿Cuántas personas?</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => setPersons(n)} style={{ flex: 1, padding: "12px", border: `2px solid ${persons === n ? COLORS.primary : COLORS.border}`, borderRadius: 12, background: persons === n ? COLORS.accent : "white", color: persons === n ? COLORS.primary : COLORS.textMuted, fontSize: 18, fontWeight: 700, cursor: "pointer" }}>{n}</button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setStep(2)}>Crear hogar →</button>
        </>
      )
    },
    {
      title: "Invitá a tu pareja",
      content: (
        <>
          <div className="onboard-illustration">💌</div>
          <div style={{ fontFamily: FONTS.display, fontSize: 24, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>¡Hogar creado!</div>
          <p style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 24, lineHeight: 1.5 }}>Compartí este link con tu pareja para que se una al hogar y puedan planificar juntos.</p>
          <div style={{ background: COLORS.accent, borderRadius: 12, padding: "14px 16px", marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, color: COLORS.primary, fontWeight: 500, flex: 1, wordBreak: "break-all" }}>mealplanner.app/join/casa-ana-carlos</span>
            <button style={{ background: COLORS.primary, color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Copiar</button>
          </div>
          <button className="btn btn-primary" onClick={onComplete} style={{ marginBottom: 12 }}>Ir a la app →</button>
          <button className="btn btn-ghost" onClick={onComplete} style={{ width: "100%" }}>Invitar después</button>
        </>
      )
    }
  ];

  return (
    <div className="onboarding">
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
      {steps[step].content}
    </div>
  );
}

function RecipesScreen({ recipes, setRecipes }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showImageFlow, setShowImageFlow] = useState(false);
  const [addTab, setAddTab] = useState("manual");
  const [form, setForm] = useState({ name: "", portions: 2, emoji: "🍴", tags: "", ingredients: [{ name: "", qty: "" }] });
  const [imageStep, setImageStep] = useState(0);

  const addIngredient = () => setForm(f => ({ ...f, ingredients: [...f.ingredients, { name: "", qty: "" }] }));
  const updateIng = (i, field, val) => setForm(f => { const ings = [...f.ingredients]; ings[i][field] = val; return { ...f, ingredients: ings }; });
  const removeIng = (i) => setForm(f => ({ ...f, ingredients: f.ingredients.filter((_, idx) => idx !== i) }));

  const saveRecipe = () => {
    if (!form.name) return;
    setRecipes(prev => [...prev, { id: Date.now(), ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) }]);
    setShowAdd(false);
    setForm({ name: "", portions: 2, emoji: "🍴", tags: "", ingredients: [{ name: "", qty: "" }] });
  };

  const emojis = ["🍗", "🍝", "🥩", "🥚", "🫘", "🥗", "🍲", "🥘", "🌮", "🍛", "🥙", "🍜"];

  return (
    <div className="screen">
      <div className="header">
        <div className="header-title">Mis Recetas</div>
        <div className="header-subtitle">{recipes.length} recetas en tu biblioteca</div>
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
        {recipes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <div className="empty-title">Tu biblioteca está vacía</div>
            <div className="empty-text">Cargá tus primeras recetas para poder planificar la semana.</div>
          </div>
        ) : (
          recipes.map(r => (
            <div key={r.id} className="recipe-card" onClick={() => setShowDetail(r)}>
              <div className="recipe-emoji">{r.emoji}</div>
              <div className="recipe-info">
                <div className="recipe-name">{r.name}</div>
                <div className="recipe-meta">🍽️ {r.portions} porciones · {r.ingredients.length} ingredientes</div>
                <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                  {(r.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
              <div style={{ color: COLORS.textMuted, fontSize: 18 }}>›</div>
            </div>
          ))
        )}
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>+</button>

      {/* Add Recipe Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">Nueva receta</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button className={`btn btn-sm ${addTab === "manual" ? "btn-primary" : "btn-ghost"}`} onClick={() => setAddTab("manual")} style={{ flex: 1 }}>✏️ Manual</button>
              <button className={`btn btn-sm ${addTab === "image" ? "btn-primary" : "btn-ghost"}`} onClick={() => { setAddTab("image"); setImageStep(0); }} style={{ flex: 1 }}>📸 Desde imagen</button>
            </div>

            {addTab === "manual" ? (
              <>
                <div className="input-group">
                  <label className="input-label">Nombre de la receta *</label>
                  <input className="input-field" placeholder="Ej: Pollo al horno" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Emoji</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {emojis.map(e => (
                      <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))} style={{ width: 40, height: 40, fontSize: 22, background: form.emoji === e ? COLORS.accent : "white", border: `2px solid ${form.emoji === e ? COLORS.primary : COLORS.border}`, borderRadius: 10, cursor: "pointer" }}>{e}</button>
                    ))}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Porciones que rinde *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <button key={n} onClick={() => setForm(f => ({ ...f, portions: n }))} style={{ flex: 1, padding: "10px 0", border: `2px solid ${form.portions === n ? COLORS.primary : COLORS.border}`, borderRadius: 10, background: form.portions === n ? COLORS.accent : "white", color: form.portions === n ? COLORS.primary : COLORS.textMuted, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{n}</button>
                    ))}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Tags (separados por coma)</label>
                  <input className="input-field" placeholder="rápido, vegetariano, con pollo..." value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Ingredientes *</label>
                  {form.ingredients.map((ing, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input className="input-field" placeholder="Ingrediente" value={ing.name} onChange={e => updateIng(i, "name", e.target.value)} style={{ flex: 2 }} />
                      <input className="input-field" placeholder="Cantidad" value={ing.qty} onChange={e => updateIng(i, "qty", e.target.value)} style={{ flex: 1 }} />
                      {form.ingredients.length > 1 && <button onClick={() => removeIng(i)} style={{ background: "none", border: "none", color: COLORS.error, fontSize: 18, cursor: "pointer", padding: "0 4px" }}>×</button>}
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" onClick={addIngredient} style={{ marginTop: 4 }}>+ Agregar ingrediente</button>
                </div>
                <button className="btn btn-primary" onClick={saveRecipe}>Guardar receta</button>
              </>
            ) : (
              <div>
                {imageStep === 0 && (
                  <>
                    <div style={{ border: `2px dashed ${COLORS.accentDark}`, borderRadius: 16, padding: "40px 20px", textAlign: "center", marginBottom: 20, background: COLORS.accent }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: COLORS.primary, marginBottom: 8 }}>Subí tus screenshots</p>
                      <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5 }}>Podés subir hasta 5 imágenes de la misma receta (Instagram, libros, webs...)</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                      {[1, 2, 3].map(n => (
                        <div key={n} style={{ flex: 1, height: 80, background: COLORS.accent, borderRadius: 12, border: `2px solid ${COLORS.accentDark}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                          {n === 1 ? "🖼️" : n === 2 ? "🖼️" : "+"}
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-primary" onClick={() => setImageStep(1)}>Analizar con IA ✨</button>
                  </>
                )}
                {imageStep === 1 && (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Analizando imágenes...</p>
                    <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 32 }}>La IA está extrayendo los datos de tu receta</p>
                    <div style={{ background: COLORS.accent, borderRadius: 12, padding: 16, textAlign: "left", marginBottom: 24 }}>
                      {["Detectando nombre de la receta...", "Extrayendo ingredientes...", "Identificando cantidades...", "Calculando porciones..."].map((t, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 3 ? `1px solid ${COLORS.border}` : "none" }}>
                          <span style={{ color: COLORS.success, fontSize: 16 }}>✓</span>
                          <span style={{ fontSize: 13, color: COLORS.textMuted }}>{t}</span>
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-primary" onClick={() => { setImageStep(2); setForm({ name: "Risotto de hongos", portions: 2, emoji: "🍚", tags: "vegetariano", ingredients: [{ name: "Arroz arborio", qty: "300g" }, { name: "Hongos secos", qty: "50g" }, { name: "Cebolla", qty: "1 unidad" }, { name: "Vino blanco", qty: "100ml" }, { name: "Queso parmesano", qty: "80g" }] }); }}>Ver resultado →</button>
                  </div>
                )}
                {imageStep === 2 && (
                  <>
                    <div style={{ background: COLORS.accent, borderRadius: 12, padding: "10px 14px", marginBottom: 20, display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 18 }}>✨</span>
                      <span style={{ fontSize: 13, color: COLORS.primary, fontWeight: 500 }}>Receta extraída. Revisá y corregí si es necesario.</span>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Nombre *</label>
                      <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Porciones</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[1, 2, 3, 4].map(n => (
                          <button key={n} onClick={() => setForm(f => ({ ...f, portions: n }))} style={{ flex: 1, padding: "10px 0", border: `2px solid ${form.portions === n ? COLORS.primary : COLORS.border}`, borderRadius: 10, background: form.portions === n ? COLORS.accent : "white", color: form.portions === n ? COLORS.primary : COLORS.textMuted, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{n}</button>
                        ))}
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Ingredientes</label>
                      {form.ingredients.map((ing, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                          <input className="input-field" value={ing.name} onChange={e => updateIng(i, "name", e.target.value)} style={{ flex: 2 }} />
                          <input className="input-field" value={ing.qty} onChange={e => updateIng(i, "qty", e.target.value)} style={{ flex: 1 }} />
                        </div>
                      ))}
                    </div>
                    <button className="btn btn-primary" onClick={saveRecipe}>Guardar receta</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowDetail(null)}>
          <div className="modal">
            <div className="modal-handle" />
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 52, width: 72, height: 72, background: COLORS.accent, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{showDetail.emoji}</div>
              <div>
                <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: COLORS.text }}>{showDetail.name}</div>
                <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 4 }}>🍽️ {showDetail.portions} porciones</div>
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {(showDetail.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Ingredientes</div>
            {showDetail.ingredients.map((ing, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 14, color: COLORS.text }}>{ing.name}</span>
                <span style={{ fontSize: 14, color: COLORS.textMuted, fontWeight: 500 }}>{ing.qty}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowDetail(null)}>Editar</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => { setRecipes(r => r.filter(x => x.id !== showDetail.id)); setShowDetail(null); }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlannerScreen({ recipes, plan, setPlan }) {
  const [showSlotPicker, setShowSlotPicker] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(Object.keys(plan).length > 0 && Object.values(plan).some(d => d.lunch || d.dinner));

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setPlan(buildInitialPlan(recipes));
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  const pickRecipe = (day, mealType, recipe) => {
    setPlan(p => ({ ...p, [day]: { ...p[day], [mealType]: recipe } }));
    setShowSlotPicker(null);
  };

  const countPlanned = () => Object.values(plan).reduce((acc, d) => acc + (d.lunch ? 1 : 0) + (d.dinner ? 1 : 0), 0);

  return (
    <div className="screen">
      <div className="header">
        <div className="header-title">Esta semana</div>
        <div className="header-subtitle">Lunes 3 — Domingo 9 de Marzo</div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-num">{countPlanned()}</div>
          <div className="stat-label">comidas planif.</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{14 - countPlanned()}</div>
          <div className="stat-label">slots vacíos</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{new Set([...Object.values(plan).map(d => d.lunch?.id), ...Object.values(plan).map(d => d.dinner?.id)].filter(Boolean)).size}</div>
          <div className="stat-label">recetas usadas</div>
        </div>
      </div>

      {!generated ? (
        <div style={{ padding: "0 20px" }}>
          <div className="card" style={{ background: "linear-gradient(135deg, #2D5016, #4A7C28)", border: "none" }}>
            <div className="card-pad" style={{ textAlign: "center", padding: "32px 20px" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
              <div style={{ fontFamily: FONTS.display, fontSize: 22, color: "white", fontWeight: 700, marginBottom: 8 }}>¿Querés que la IA planifique tu semana?</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, marginBottom: 24 }}>Usará tus {recipes.length} recetas y distribuirá las porciones automáticamente.</p>
              <button className="btn" onClick={handleGenerate} style={{ background: "white", color: COLORS.primary, padding: "14px 24px", fontSize: 15, width: "100%" }}>
                {generating ? "Generando..." : "✨ Sugerirme menú"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: "0 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>Tocá un slot para cambiar la receta</span>
            <button className="btn btn-secondary btn-sm" onClick={() => { setPlan({}); setGenerated(false); }}>Regenerar</button>
          </div>
          <div className="section-pad">
            <div className="week-grid">
              {DAYS.map((day, i) => (
                <div key={day} className="day-row">
                  <div className="day-header">{DAYS_FULL[i]}</div>
                  <div className="meal-slots">
                    {["lunch", "dinner"].map(type => {
                      const recipe = plan[day]?.[type];
                      return (
                        <div key={type} className="meal-slot" onClick={() => setShowSlotPicker({ day, type })}>
                          <div className="slot-label">{type === "lunch" ? "🌤 Almuerzo" : "🌙 Cena"}</div>
                          {recipe ? (
                            <>
                              <div className="slot-recipe">{recipe.emoji} {recipe.name}</div>
                              <div className="slot-portions">{recipe.portions} porciones</div>
                            </>
                          ) : (
                            <div className="slot-empty">Sin asignar</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Slot Picker Modal */}
      {showSlotPicker && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowSlotPicker(null)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">Elegir receta</div>
            <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 16 }}>
              {DAYS_FULL[DAYS.indexOf(showSlotPicker.day)]} — {showSlotPicker.type === "lunch" ? "Almuerzo" : "Cena"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {recipes.map(r => (
                <div key={r.id} className="recipe-card" onClick={() => pickRecipe(showSlotPicker.day, showSlotPicker.type, r)}>
                  <div className="recipe-emoji" style={{ width: 40, height: 40, fontSize: 22 }}>{r.emoji}</div>
                  <div className="recipe-info">
                    <div className="recipe-name">{r.name}</div>
                    <div className="recipe-meta">{r.portions} porciones</div>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-danger" style={{ width: "100%" }} onClick={() => pickRecipe(showSlotPicker.day, showSlotPicker.type, null)}>Quitar receta</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingScreen({ plan, recipes }) {
  const [checkedItems, setCheckedItems] = useState({});
  const categories = buildShoppingList(plan, recipes);
  const totalItems = Object.values(categories).flat().length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const hasItems = totalItems > 0;

  const toggleItem = (key) => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  const resetAll = () => setCheckedItems({});

  return (
    <div className="screen">
      <div className="header">
        <div className="header-title">Lista de compras</div>
        <div className="header-subtitle">{hasItems ? `${checkedCount} de ${totalItems} ítems marcados` : "Planificá la semana primero"}</div>
      </div>

      {!hasItems ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <div className="empty-title">Tu lista está vacía</div>
          <div className="empty-text">Planificá tu semana primero para que se genere la lista de compras automáticamente.</div>
        </div>
      ) : (
        <>
          {checkedCount > 0 && (
            <div style={{ padding: "0 20px 8px" }}>
              <div style={{ background: COLORS.accent, borderRadius: 12, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: COLORS.primary, fontWeight: 500 }}>🎉 ¡{checkedCount} ítem{checkedCount > 1 ? "s" : ""} en el changuito!</span>
                <button onClick={resetAll} style={{ fontSize: 12, color: COLORS.textMuted, background: "none", border: "none", cursor: "pointer" }}>Resetear</button>
              </div>
            </div>
          )}

          <div style={{ padding: "8px 20px" }}>
            {Object.entries(categories).filter(([, items]) => items.length > 0).map(([cat, items]) => (
              <div key={cat} className="shopping-category">
                <div className="category-title">{cat}</div>
                {items.map((item, i) => {
                  const key = `${cat}-${i}`;
                  const checked = !!checkedItems[key];
                  return (
                    <div key={key} className={`shopping-item ${checked ? "checked" : ""}`} onClick={() => toggleItem(key)}>
                      <div className={`check-circle ${checked ? "done" : ""}`}>
                        {checked && <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>✓</span>}
                      </div>
                      <span className="item-name">{item.name}</span>
                      <span className="item-qty">{item.qty}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ConfigScreen({ persons, setPersons }) {
  const [household] = useState("Casa de Ana y Carlos");
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div className="screen">
      <div className="header">
        <div className="header-title">Configuración</div>
        <div className="header-subtitle">{household}</div>
      </div>

      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Household */}
        <div className="card">
          <div className="card-pad">
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>Mi hogar</div>
            <div className="member-row">
              <div className="avatar">👩</div>
              <div className="member-info">
                <div className="member-name">Ana (vos)</div>
                <div className="member-role">Administradora</div>
              </div>
              <span className="tag">Admin</span>
            </div>
            <div className="member-row">
              <div className="avatar">👨</div>
              <div className="member-info">
                <div className="member-name">Carlos</div>
                <div className="member-role">Miembro</div>
              </div>
              <span style={{ fontSize: 11, color: COLORS.success, fontWeight: 600 }}>✓ Activo</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => setShowInvite(true)}>
                + Invitar persona
              </button>
            </div>
          </div>
        </div>

        {/* Persons */}
        <div className="card">
          <div className="card-pad">
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Personas en el hogar</div>
            <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 14, lineHeight: 1.5 }}>Afecta el cálculo de porciones y la lista de compras.</p>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <button key={n} onClick={() => setPersons(n)} style={{ flex: 1, padding: "12px 0", border: `2px solid ${persons === n ? COLORS.primary : COLORS.border}`, borderRadius: 12, background: persons === n ? COLORS.accent : "white", color: persons === n ? COLORS.primary : COLORS.textMuted, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>{n}</button>
              ))}
            </div>
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 10 }}>
              {persons === 1 ? "1 persona — las porciones son para vos sola." : `${persons} personas — las porciones se dividen entre ${persons}.`}
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="card">
          <div className="card-pad">
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 14 }}>Sobre la app</div>
            {[["🍽️ Versión", "1.0 MVP"], ["📱 Plataforma", "PWA — instalable en iPhone"], ["☁️ Datos", "Guardados en Supabase"], ["🤖 IA", "Claude Sonnet"]].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                <span style={{ fontSize: 14, color: COLORS.text }}>{label}</span>
                <span style={{ fontSize: 14, color: COLORS.textMuted }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showInvite && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowInvite(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <div className="modal-title">Invitar al hogar</div>
            <div style={{ background: COLORS.accent, borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, color: COLORS.primary, fontWeight: 500, flex: 1, wordBreak: "break-all" }}>mealplanner.app/join/casa-ana-carlos</span>
              <button style={{ background: COLORS.primary, color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Copiar</button>
            </div>
            <button className="btn btn-primary" onClick={() => setShowInvite(false)}>Compartir por WhatsApp</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [tab, setTab] = useState("planner");
  const [recipes, setRecipes] = useState(INITIAL_RECIPES);
  const [plan, setPlan] = useState(buildInitialPlan(INITIAL_RECIPES));
  const [persons, setPersons] = useState(2);

  const navItems = [
    { id: "recipes", icon: "📖", label: "Recetas" },
    { id: "planner", icon: "📅", label: "Semana" },
    { id: "shopping", icon: "🛒", label: "Compras" },
    { id: "config", icon: "⚙️", label: "Config" },
  ];

  if (!onboarded) return (
    <>
      <style>{css}</style>
      <div className="app"><OnboardingScreen onComplete={() => setOnboarded(true)} /></div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">
        {tab === "recipes" && <RecipesScreen recipes={recipes} setRecipes={setRecipes} />}
        {tab === "planner" && <PlannerScreen recipes={recipes} plan={plan} setPlan={setPlan} />}
        {tab === "shopping" && <ShoppingScreen plan={plan} recipes={recipes} />}
        {tab === "config" && <ConfigScreen persons={persons} setPersons={setPersons} />}

        <nav className="bottom-nav">
          {navItems.map(item => (
            <div key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label" style={{ color: tab === item.id ? COLORS.primary : COLORS.textMuted }}>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>
    </>
  );
}
