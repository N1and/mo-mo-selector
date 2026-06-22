import { useToastStore } from '../stores/toastStore';

const typeStyles = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-gray-800',
};

export function Toast() {
  const { message, type, visible } = useToastStore();

  if (!visible) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
      <div
        className={`${typeStyles[type]} text-white px-5 py-2.5 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
