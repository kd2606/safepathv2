import { motion } from 'framer-motion';

export default function ReportCard({ report, variants }) {
  const severityColors = {
    high: '#ff453a', // danger
    medium: '#ffd60a', // warning
    low: '#30d158'   // safe
  };
  
  const color = severityColors[report.severity] || severityColors.low;
  const isDanger = report.severity === 'high';

  return (
    <motion.div 
      variants={variants}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className="bg-bg-card border border-border rounded-[16px] p-[16px] mx-[16px] mb-[8px] flex items-center gap-[12px] hover:bg-bg-card-hover"
    >
      <motion.div 
        className="w-[8px] h-[8px] rounded-full shrink-0"
        style={{ backgroundColor: color }}
        animate={isDanger ? { scale: [1, 1.3, 1] } : {}}
        transition={isDanger ? { duration: 2, repeat: Infinity } : {}}
      />
      
      <div className="flex-1 overflow-hidden">
        <p className="font-medium text-[15px] text-text-primary truncate">{report.title}</p>
        <p className="text-[13px] text-text-tertiary truncate">{report.location}</p>
      </div>

      <span className="bg-[#1a1a1a] rounded-[8px] py-[4px] px-[10px] text-[12px] text-text-secondary whitespace-nowrap">
        {report.distance}
      </span>
    </motion.div>
  );
}
