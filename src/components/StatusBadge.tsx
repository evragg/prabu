export default function StatusBadge({ status }: { status: string }) {
  const isAvailable = status === 'available';

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
        isAvailable
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full mr-1.5 ${
          isAvailable ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      {isAvailable ? 'Available' : 'None'}
    </span>
  );
}
