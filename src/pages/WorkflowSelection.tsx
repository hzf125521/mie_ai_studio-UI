import React from 'react';
import { useApp } from '../context/AppContext';
import { Activity, TrendingUp, ArrowLeft } from 'lucide-react';

export const WorkflowSelection: React.FC = () => {
  const { setWorkflow, setStep } = useApp();

  const handleSelect = (type: 'outliers' | 'regression') => {
    setWorkflow(type);
    setStep(1);
  };

  const handleBack = () => {
    setStep(-1);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">检测任务类型</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Outliers Detection Card */}
        <div 
          onClick={() => handleSelect('outliers')}
          className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-200 p-8 flex flex-col items-center group"
        >
          <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
            <Activity className="h-10 w-10 text-indigo-600 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">异常检测</h2>
          <p className="text-gray-500 text-center">
            使用 Autoencoder、Isolation Forest 等无监督学习模型，检测时间序列数据中的异常和离群点。
          </p>
        </div>

        {/* Regression Residual Card */}
        <div 
          onClick={() => handleSelect('regression')}
          className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-200 p-8 flex flex-col items-center group"
        >
          <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
            <TrendingUp className="h-10 w-10 text-emerald-600 group-hover:text-white transition-colors" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">回归残差</h2>
          <p className="text-gray-500 text-center">
            基于回归模型（例如 RandomForestRegressor）监控残差。通过预测误差和阈值来设定报警。
          </p>
        </div>
      </div>
    </div>
  );
};
