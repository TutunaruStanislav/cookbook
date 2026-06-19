import { useState } from 'react';
import { Alert, Button, Container, Spinner, Table } from 'react-bootstrap';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Link } from 'react-router-dom';
import RecipePickerModal from '../components/RecipePickerModal';
import {
  useAddSlotItem,
  useMoveSlotItem,
  usePlan,
  useRemoveSlotItem,
  useShoppingList,
} from '../hooks/usePlanner';
import type { MealSlot, MealType, RecipeList, SlotItem } from '../types';
import { DAY_LABELS, DIFFICULTY_LABELS, MAX_DISHES_PER_SLOT, MEAL_TYPE_LABELS, UNIT_LABELS } from '../types';

// ── Week helpers ──────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getThisMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff));
}

function addWeeks(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return toDateStr(new Date(y, m - 1, d + n * 7));
}

function formatWeekRange(weekStart: string): string {
  const [y, m, d] = weekStart.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
  return `${start.toLocaleDateString('ru-RU', opts)} – ${end.toLocaleDateString('ru-RU', { ...opts, year: 'numeric' })}`;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

// DnD ids are namespaced so draggable dishes never collide with droppable slots.
const itemDragId = (itemId: number) => `item-${itemId}`;
const slotDropId = (slotId: number) => `slot-${slotId}`;
const parseId = (id: string) => Number(id.slice(5));

// ── Draggable dish chip ───────────────────────────────────────────────────────

interface ChipProps {
  item: SlotItem;
  onRemove: () => void;
}

function RecipeChip({ item, onRemove }: ChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: itemDragId(item.id) });
  const recipe = item.recipe_detail;

  return (
    <div
      ref={setNodeRef}
      className="rounded border bg-white p-1 shadow-sm"
      style={{ opacity: isDragging ? 0.25 : 1 }}
    >
      <div className="d-flex align-items-start gap-1">
        <span
          {...attributes}
          {...listeners}
          className="text-muted"
          style={{ cursor: 'grab', touchAction: 'none', userSelect: 'none', fontSize: '0.9rem', lineHeight: 1.3 }}
          title="Перетащить"
        >
          ⠿
        </span>
        <Link
          to={`/recipes/${item.recipe}`}
          className="flex-grow-1 text-break fw-semibold text-decoration-none text-dark"
          style={{ lineHeight: 1.2, fontSize: '0.8rem' }}
          title={`${recipe.title} — открыть рецепт`}
        >
          {recipe.title}
        </Link>
        <span
          className="text-danger"
          style={{ cursor: 'pointer', fontSize: '1rem', lineHeight: 1, userSelect: 'none' }}
          onClick={onRemove}
          title="Убрать блюдо"
        >
          ×
        </span>
      </div>
      <small className="text-muted d-block mt-1" style={{ fontSize: '0.65rem' }}>
        {DIFFICULTY_LABELS[recipe.difficulty]} · {recipe.cooking_time} мин
      </small>
    </div>
  );
}

// ── Droppable slot cell (holds up to 3 dishes) ──────────────────────────────────

interface CellProps {
  slot: MealSlot;
  onPick: (slotId: number) => void;
  onRemove: (itemId: number) => void;
}

function SlotCell({ slot, onPick, onRemove }: CellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: slotDropId(slot.id) });
  const full = slot.items.length >= MAX_DISHES_PER_SLOT;

  return (
    <td
      ref={setNodeRef}
      style={{
        minWidth: 130,
        padding: '0.3rem',
        verticalAlign: 'top',
        background: isOver ? 'rgba(13,110,253,0.07)' : undefined,
        transition: 'background 0.12s',
      }}
    >
      <div className="d-flex flex-column gap-1">
        {slot.items.map((item) => (
          <RecipeChip key={item.id} item={item} onRemove={() => onRemove(item.id)} />
        ))}

        {!full &&
          (slot.items.length === 0 ? (
            <button
              className="btn w-100"
              style={{
                minHeight: 72,
                border: `1.5px dashed ${isOver ? '#0d6efd' : '#ced4da'}`,
                background: 'transparent',
                color: '#adb5bd',
                fontSize: '1.4rem',
              }}
              onClick={() => onPick(slot.id)}
              title="Добавить блюдо"
            >
              +
            </button>
          ) : (
            <button
              className="btn btn-sm w-100 text-muted"
              style={{
                border: '1px dashed #ced4da',
                background: 'transparent',
                fontSize: '0.72rem',
                padding: '2px 4px',
              }}
              onClick={() => onPick(slot.id)}
              title="Добавить блюдо"
            >
              + блюдо
            </button>
          ))}
      </div>
    </td>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PlannerPage() {
  const today = getThisMonday();
  const [weekStart, setWeekStart] = useState(today);
  const [pickerSlotId, setPickerSlotId] = useState<number | null>(null);
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [showShopping, setShowShopping] = useState(false);

  const { data: plan, isLoading, isError } = usePlan(weekStart);
  const { data: shopping, isLoading: loadingShopping } = useShoppingList(weekStart, showShopping);
  const addItem = useAddSlotItem(weekStart);
  const moveItem = useMoveSlotItem(weekStart);
  const removeItem = useRemoveSlotItem(weekStart);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // Flat index of every dish across the plan (for drag lookups + overlay).
  const allItems = plan
    ? plan.slots.flatMap((s) => s.items.map((item) => ({ item, slotId: s.id })))
    : [];
  const activeEntry = allItems.find((e) => e.item.id === activeItemId);

  const handlePickerSelect = async (recipe: RecipeList) => {
    if (pickerSlotId === null) return;
    const slotId = pickerSlotId;
    setPickerSlotId(null);
    await addItem.mutateAsync({ slotId, recipeId: recipe.id });
  };

  const handleRemove = async (itemId: number) => {
    await removeItem.mutateAsync(itemId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItemId(parseId(String(event.active.id)));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItemId(null);
    if (!over || !plan) return;

    const itemId = parseId(String(active.id));
    const targetSlotId = parseId(String(over.id));
    const entry = allItems.find((e) => e.item.id === itemId);
    if (!entry || entry.slotId === targetSlotId) return;

    const target = plan.slots.find((s) => s.id === targetSlotId);
    if (!target) return;
    // Mirror backend rules so a doomed move never even fires.
    if (target.items.length >= MAX_DISHES_PER_SLOT) return;
    if (target.items.some((it) => it.recipe === entry.item.recipe)) return;

    await moveItem.mutateAsync({ itemId, targetSlotId });
  };

  return (
    <Container className="py-4">
      <h4 className="fw-semibold mb-3">Планировщик меню</h4>

      {/* Week navigation */}
      <div className="d-flex align-items-center gap-2 mb-4 flex-wrap">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setWeekStart(addWeeks(weekStart, -1))}
        >
          ← Пред. неделя
        </Button>
        <span className="fw-semibold px-1">{formatWeekRange(weekStart)}</span>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setWeekStart(addWeeks(weekStart, 1))}
        >
          След. неделя →
        </Button>
        {weekStart !== today && (
          <Button
            variant="link"
            size="sm"
            className="p-0 text-muted"
            onClick={() => setWeekStart(today)}
          >
            Текущая неделя
          </Button>
        )}
      </div>

      <p className="text-muted small mb-3">
        В один слот можно добавить до {MAX_DISHES_PER_SLOT} блюд. Перетащите блюдо за значок «⠿»,
        чтобы перенести его в другой слот.
      </p>

      {/* Grid */}
      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {isError && (
        <Alert variant="danger">Не удалось загрузить план меню. Попробуйте обновить страницу.</Alert>
      )}

      {plan && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ overflowX: 'auto' }}>
            <Table bordered size="sm" className="mb-0" style={{ minWidth: 740 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 90, background: '#f8f9fa' }} />
                  {DAY_LABELS.map((day) => (
                    <th
                      key={day}
                      className="text-center"
                      style={{ background: '#f8f9fa', minWidth: 130 }}
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEAL_TYPES.map((mealType) => (
                  <tr key={mealType}>
                    <th
                      className="align-middle text-muted"
                      style={{
                        background: '#f8f9fa',
                        fontSize: '0.83rem',
                        fontWeight: 600,
                        paddingLeft: '0.5rem',
                      }}
                    >
                      {MEAL_TYPE_LABELS[mealType]}
                    </th>
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                      const slot = plan.slots.find(
                        (s) => s.day === day && s.meal_type === mealType,
                      );
                      if (!slot) return <td key={day} className="bg-light" />;
                      return (
                        <SlotCell
                          key={day}
                          slot={slot}
                          onPick={setPickerSlotId}
                          onRemove={handleRemove}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeEntry && (
              <div
                className="rounded border bg-white px-2 py-1 shadow"
                style={{ width: 140, opacity: 0.92 }}
              >
                <small className="fw-semibold d-block">{activeEntry.item.recipe_detail.title}</small>
                <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                  {activeEntry.item.recipe_detail.cooking_time} мин
                </small>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Shopping list */}
      {plan && (
        <div className="mt-4">
          <Button
            variant={showShopping ? 'secondary' : 'outline-secondary'}
            size="sm"
            onClick={() => setShowShopping(!showShopping)}
          >
            {showShopping ? 'Скрыть список покупок' : 'Список покупок'}
          </Button>

          {showShopping && (
            <div className="mt-3">
              <h6 className="fw-semibold mb-2">
                Список покупок — {formatWeekRange(weekStart)}
              </h6>

              {loadingShopping && <Spinner animation="border" size="sm" variant="secondary" />}

              {shopping && shopping.length === 0 && (
                <p className="text-muted small">Список пуст — заполните план меню рецептами.</p>
              )}

              {shopping && shopping.length > 0 && (
                <Table size="sm" hover style={{ maxWidth: 420 }}>
                  <thead>
                    <tr>
                      <th>Ингредиент</th>
                      <th className="text-end">Количество</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopping.map((item) => (
                      <tr key={`${item.ingredient_id}-${item.unit}`}>
                        <td>{item.ingredient}</td>
                        <td className="text-end text-nowrap">
                          <strong>
                            {item.total_amount % 1 === 0
                              ? item.total_amount
                              : item.total_amount.toFixed(2)}
                          </strong>{' '}
                          {UNIT_LABELS[item.unit] ?? item.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </div>
          )}
        </div>
      )}

      <RecipePickerModal
        show={pickerSlotId !== null}
        onHide={() => setPickerSlotId(null)}
        onSelect={handlePickerSelect}
      />
    </Container>
  );
}
