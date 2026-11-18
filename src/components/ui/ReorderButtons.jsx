import Icon from "@/components/ui/Icon";

export default function ReorderButtons({ label, index, count, onMove, disabled }) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        className="icon-btn h-6 w-7 rounded-md"
        onClick={() => onMove(index, -1)}
        disabled={disabled || index === 0}
        aria-label={`Move ${label} up`}
        title="Move up"
      >
        <Icon name="chevronUp" className="h-4 w-4" strokeWidth={2} />
      </button>
      <button
        type="button"
        className="icon-btn h-6 w-7 rounded-md"
        onClick={() => onMove(index, 1)}
        disabled={disabled || index === count - 1}
        aria-label={`Move ${label} down`}
        title="Move down"
      >
        <Icon name="chevronDown" className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}
