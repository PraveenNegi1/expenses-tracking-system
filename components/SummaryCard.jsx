import { ArrowUpIcon, ArrowDownIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';

export default function SummaryCard({ title, amount, color, trend = 'neutral' }) {
  const colorVariants = {
    green: {
      gradient: "from-green-400 to-green-600",
      text: "text-green-900",
      iconColor: "text-green-700",
      trendIcon: trend === 'up' ? ArrowUpIcon : trend === 'down' ? ArrowDownIcon : null,
    },
    red: {
      gradient: "from-red-400 to-red-600",
      text: "text-red-900",
      iconColor: "text-red-700",
      trendIcon: trend === 'up' ? ArrowUpIcon : trend === 'down' ? ArrowDownIcon : null,
    },
    blue: {
      gradient: "from-blue-400 to-blue-600",
      text: "text-blue-900",
      iconColor: "text-blue-700",
      trendIcon: trend === 'up' ? ArrowUpIcon : trend === 'down' ? ArrowDownIcon : null,
    },
  };

  const variant = colorVariants[color] || colorVariants.blue;
  const TrendIcon = variant.trendIcon;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div
        className={`relative overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br ${variant.gradient} text-white p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-md border border-white/20`}
      >
        <div className="absolute inset-0 bg-white/10"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium opacity-90">{title}</h2>
            {TrendIcon && (
              <TrendIcon className="h-8 w-8 text-white/70" />
            )}
          </div>

          <div className="flex items-end justify-between">
            <p className="text-4xl font-bold tracking-tight">
              ₹{amount.toLocaleString('en-IN')}
            </p>
            <CurrencyRupeeIcon className="h-10 w-10 opacity-50" />
          </div>
        </div>

        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(255,255,255,0.1)"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  );
}