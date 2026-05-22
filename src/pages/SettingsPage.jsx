import { Card, Field, Input, Button } from '@components/ui';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-extrabold text-ink text-end">הגדרות</h1>
      <Card className="space-y-4">
        <Field label="שם מלא"><Input placeholder="ישראל ישראלי" /></Field>
        <Field label="אימייל"><Input type="email" placeholder="user@craftad.ai" /></Field>
        <div className="flex justify-end"><Button>שמור שינויים</Button></div>
      </Card>
    </div>
  );
}
