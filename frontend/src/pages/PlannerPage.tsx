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
import RecipePickerModal from '../components/RecipePickerModal';
import { usePlan, useShoppingList, useUpdateSlot } from '../hooks/usePlanner';
import type { MealSlot, MealType, RecipeList } from '../types';
import { DAY_LABELS, MEAL_TYPE_LABELS, UNIT_LABELS } from '../types';

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

// ── Draggable recipe chip ─────────────────────────────────────────────────────

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];

interface ChipProps {
  slot: MealSlot;
  onClear: () => void;
  onPick: () => void;
}

function RecipeChip({ slot, onClear, onPick }: ChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: slot.id });

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
        <small
          className="flex-grow-1 text-break"
          style={{ lineHeight: 1.25, cursor: 'pointer' }}
          onClick={onPick}
          title="Изменить рецепт"
        >
          {slot.recipe!.title}
        </small>
        <span
          className="text-danger"
          style={{ cursor: 'pointer', fontSize: '1rem', lineHeight: 1, userSelect: 'none' }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClear}
          title="Убрать"
        >
          ×
        </span>
      </div>
      <small className="text-muted d-block mt-1" style={{ fontSize: '0.65rem' }}>
        {slot.recipe!.cooking_time} мин
      </small>
    </div>
  );
}

// ── Droppable slot cell ───────────────────────────────────────────────────────

interface CellProps {
  slot: MealSlot;
  onPick: (slotId: number) => void;
  onClear: (slotId: number) => void;
}

function SlotCell({ slot, onPick, onClear }: CellProps) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id });

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
      {slot.recipe ? (
        <RecipeChip
          slot={slot}
          onClear={() => onClear(slot.id)}
          onPick={() => onPick(slot.id)}
        />
      ) : (
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
          title="Добавить рецепт"
        >
          +
        </button>
      )}
    </td>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PlannerPage() {
  const today = getThisMonday();
  const [weekStart, setWeekStart] = useState(today);
  const [pickerSlotId, setPickerSlotId] = useState<number | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);
  const [showShopping, setShowShopping] = useState(false);

  const { data: plan, isLoading, isError } = usePlan(weekStart);
  const { data: shopping, isLoading: loadingShopping } = useShoppingList(weekStart, showShopping);
  const updateSlot = useUpdateSlot(weekStart);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const activeSlot = plan?.slots.find((s) => s.id === activeSlotId);

  const handlePickerSelect = async (recipe: RecipeList) => {
    if (pickerSlotId === null) return;
    setPickerSlotId(null);
    await updateSlot.mutateAsync({ slotId: pickerSlotId, recipeId: recipe.id });
  };

  const handleClear = async (slotId: number) => {
    await updateSlot.mutateAsync({ slotId, recipeId: null });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveSlotId(event.active.id as number);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveSlotId(null);
    if (!over || !plan || active.id === over.id) return;

    const srcId = active.id as number;
    const dstId = over.id as number;
    const srcSlot = plan.slots.find((s) => s.id === srcId);
    const dstSlot = plan.slots.find((s) => s.id === dstId);
    if (!srcSlot?.recipe) return;

    await updateSlot.mutateAsync({ slotId: dstId, recipeId: srcSlot.recipe.id });
    await updateSlot.mutateAsync({ slotId: srcId, recipeId: dstSlot?.recipe?.id ?? null });
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
                          onClear={handleClear}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeSlot?.recipe && (
              <div
                className="rounded border bg-white px-2 py-1 shadow"
                style={{ width: 140, opacity: 0.92 }}
              >
                <small className="fw-semibold d-block">{activeSlot.recipe.title}</small>
                <small className="text-muted" style={{ fontSize: '0.65rem' }}>
                  {activeSlot.recipe.cooking_time} мин
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
