import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Device, Model, WorkflowType } from '../types';
import { Modal } from '../components/ui/Modal';
import { Trash2, Settings, Play, CheckCircle, StopCircle, Eye } from 'lucide-react';

export const DeviceSelection: React.FC = () => {
  const {
    devices,
    allModels,
    setSelectedDeviceId,
    setStep,
    setWorkflow,
    deployedModels,
    undeployModel,
    deployModel,
    removeModel,
    validations,
    allValidations,
    selectedDeviceId
  } = useApp();

  const [selectedDevice, setSelectedDevice] = useState<string>(selectedDeviceId || '');
  const [modelToDelete, setModelToDelete] = useState<Model | null>(null);

  const handleConfigure = () => {
    if (!selectedDevice) {
      alert('请先选择一个设备。');
      return;
    }
    setSelectedDeviceId(selectedDevice);
    setStep(0); // Go to Workflow Selection
  };

  const getModelStatus = (model: Model) => {
    if (model.status === 'training') return '训练中';
    if (model.status === 'failed') return '失败';

    // Check validation first
    const hasValidation = allValidations.some(v => v.modelId === model.id);
    if (hasValidation) return '已验证';

    return '已训练';
  };

  const isModelDeployed = (model: Model) => {
    if (!model.deviceId || !model.workflow) return false;
    return deployedModels[`${model.deviceId}_${model.workflow}`] === model.id;
  };

  const handleDetails = (model: Model) => {
    if (!model.deviceId) return;
    setSelectedDeviceId(model.deviceId);
    if (model.workflow) setWorkflow(model.workflow);

    const status = getModelStatus(model);
    if (status === '已训练') {
      setStep(2); // Go to Step 3 (Training/Validation)
    } else if (status === '已验证') {
      setStep(3); // Go to Step 4 (Deployment)
    } else {
      // Fallback
      setStep(2);
    }
  };

  const handleDeployToggle = (model: Model) => {
    if (!model.deviceId || !model.workflow) return;
    const isDeployed = isModelDeployed(model);
    if (isDeployed) {
      undeployModel(model.deviceId, model.workflow);
    } else {
      deployModel(model.deviceId, model.workflow, model.id);
    }
  };

  const handleDeleteClick = (model: Model) => {
    setModelToDelete(model);
  };

  const confirmDelete = () => {
    if (modelToDelete) {
      removeModel(modelToDelete.id);
      setModelToDelete(null);
    }
  };

  // Enhance models with device info
  const tableData = allModels.map(model => {
    const device = devices.find(d => d.id === model.deviceId);
    return {
      ...model,
      deviceName: device?.name || '未知',
      deviceCode: device?.code || '未知',
      statusLabel: getModelStatus(model),
      isDeployed: isModelDeployed(model)
    };
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">设备选择与模型管理</h1>

      {/* Device Selection Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 flex items-end gap-4">
        <div className="flex-1">
          <label htmlFor="device-select" className="block text-sm font-medium text-gray-700 mb-2">
            选择设备
          </label>
          <select
            id="device-select"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm border"
          >
            <option value="">-- 请选择一个设备 --</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} ({device.code})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleConfigure}
          disabled={!selectedDevice}
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 h-10"
        >
          <Settings className="w-4 h-4" />
          配置模型
        </button>
      </div>

      {/* Algorithm List Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">算法列表</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备名称</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备编号</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">模型名称</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">未找到模型。</td>
                </tr>
              ) : (
                tableData.map((model) => (
                  <tr key={model.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{model.deviceName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{model.deviceCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {model.workflow === 'outliers' ? '异常检测' : '回归残差'} - {model.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${model.isDeployed ? 'bg-green-100 text-green-800' :
                        model.statusLabel.includes('Pending') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {model.isDeployed ? '已部署' : model.statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                      <button
                        onClick={() => handleDetails(model)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                        title="详情"
                      >
                        <Eye className="w-4 h-4" /> 详情
                      </button>

                      {(getModelStatus(model) === '已验证' || isModelDeployed(model)) ? (
                        <button
                          onClick={() => handleDeployToggle(model)}
                          className={`flex items-center gap-1 ${isModelDeployed(model)
                            ? 'text-orange-600 hover:text-orange-900'
                            : 'text-green-600 hover:text-green-900'
                            }`}
                          title={isModelDeployed(model) ? "停止部署" : "部署模型"}
                        >
                          {isModelDeployed(model) ? (
                            <>
                              <StopCircle className="w-4 h-4" /> 停止
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4" /> 部署
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="text-gray-400 cursor-not-allowed flex items-center gap-1"
                          title="验证模型后可部署"
                        >
                          <Play className="w-4 h-4" /> 部署
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteClick(model)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                        title="删除模型"
                      >
                        <Trash2 className="w-4 h-4" /> 删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!modelToDelete}
        onClose={() => setModelToDelete(null)}
        title="删除模型"
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            您确定要删除模型 "{modelToDelete?.name}" 吗？
          </p>
          {modelToDelete && (
            <p className="text-sm text-gray-500 mt-2">
              当前状态: <span className="font-semibold">{getModelStatus(modelToDelete)}</span>
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            onClick={() => setModelToDelete(null)}
          >
            取消
          </button>
          <button
            type="button"
            className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            onClick={confirmDelete}
          >
            删除
          </button>
        </div>
      </Modal>
    </div>
  );
};
