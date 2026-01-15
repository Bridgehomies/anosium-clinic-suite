import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { name: 'Mon', appointments: 24, completed: 20 },
  { name: 'Tue', appointments: 32, completed: 28 },
  { name: 'Wed', appointments: 28, completed: 25 },
  { name: 'Thu', appointments: 35, completed: 30 },
  { name: 'Fri', appointments: 40, completed: 36 },
  { name: 'Sat', appointments: 22, completed: 18 },
  { name: 'Sun', appointments: 15, completed: 12 },
];

const AppointmentChart = () => {
  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">
            Weekly Appointments
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Scheduled vs completed appointments
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-navy" />
            <span className="text-xs text-muted-foreground">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-teal" />
            <span className="text-xs text-muted-foreground">Completed</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#36406D" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#36406D" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#59C4C1" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#59C4C1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 40px -10px rgba(54, 64, 109, 0.15)',
              }}
            />
            <Area
              type="monotone"
              dataKey="appointments"
              stroke="#36406D"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAppointments)"
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#59C4C1"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCompleted)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AppointmentChart;
