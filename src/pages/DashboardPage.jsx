import { Card } from '@components/ui';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink">לוח בקרה</h1>
        <button className="btn-primary">צרו קריאייטיב חדש</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'קריאייטיבים', value: '128' },
          { label: 'קמפיינים פעילים', value: '12' },
          { label: 'CTR ממוצע', value: '4.8%' },
        ].map((s) => (
          <Card key={s.label} className="text-end">
            <p className="text-sm text-ink-muted">{s.label}</p>
            <p className="text-3xl font-extrabold mt-2 text-ink">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="text-end">
        <h2 className="text-xl font-bold text-ink mb-2">פעילות אחרונה</h2>
        <p className="text-ink-muted">אין פעילות להצגה כרגע.</p>
      </Card>
    </div>
  );
}
