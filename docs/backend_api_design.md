# 数理模型训练部署 (MIE AI Studio) 后端开发文档

## 1. 数据结构设计 (Data Model Design)

### 1.1 设备 (Device)
代表需要进行数据采集和模型训练的物理设备（如泵站、压缩机等）。
- `id`: `String` (UUID) - 主键
- `name`: `String` - 设备名称（如 "Pump Station A"）
- `code`: `String` - 设备编码/序列号
- `created_by`: `String` - 创建人ID
- `created_at`: `DateTime` - 创建时间
- `updated_by`: `String` - 最后一次修改人ID
- `updated_at`: `DateTime` - 最后一次修改时间
- `is_deleted`: `Boolean` - 是否已删除 (逻辑删除标记，默认 false)
- `deleted_by`: `String` - 删除操作人ID
- `deleted_at`: `DateTime` - 删除时间

### 1.2 数据集/信号 (Dataset / Signal)
前端的 `Signal` 实体代表用于训练和验证的时序数据批次。
- `id`: `String` (UUID) - 主键
- `name`: `String` - 数据集名称（如 "Signal_20230101_1200"）
- `equipment_id`: `String` - 关联的设备ID (外键)
- `workflow`: `Enum('outliers', 'regression')` - 适用的工作流类型（异常检测或回归预测）
- `start_time`: `DateTime` - 截取时序数据的开始时间
- `end_time`: `DateTime` - 截取时序数据的结束时间
- `features`: `JSON` (String Array) - 选中的特征列名列表，例如 `["PointA_Temp", "PointA_Pressure"]`
- `target_feature`: `String` - 目标特征列名（仅在 `workflow = regression` 时有效，否则为 null）
- `2D_PCA_DATA`: `JSON` - 2D PCA 降维后的数据

- `created_by`: `String` - 创建人ID
- `created_at`: `DateTime` - 创建时间
- `updated_by`: `String` - 最后一次修改人ID
- `updated_at`: `DateTime` - 最后一次修改时间
- `is_deleted`: `Boolean` - 是否已删除 (逻辑删除标记，默认 false)
- `deleted_by`: `String` - 删除操作人ID
- `deleted_at`: `DateTime` - 删除时间

### 1.3 模型 (Model)
记录用户触发的模型训练任务及模型元数据。
- `id`: `String` (UUID) - 主键
- `name`: `String` - 模型名称
- `equipment_id`: `String` - 关联设备ID
- `workflow`: `Enum('outliers', 'regression')` - 工作流类型
- `algorithm`: `String` - 算法名称（如 "RandomForestRegressor", "Autoencoder"）
- `parameters`: `JSON` - 超参数配置（如 `{ "epochs": 100, "batchSize": 32 }`）
- `preprocessing`: `JSON` - 预处理配置（如 `{ "standardization": true, "pca": 0 }`）
- `features`: `JSON` (String Array) - 模型训练时实际使用的输入特征列名列表，严格保持顺序（例如 `["PointA_Temp", "PointA_Pressure"]`）
- `target_feature`: `String` - 模型预测的目标特征（仅回归任务有效）
- `train_dataset_ids`: `JSON` (String Array) - 训练使用的数据集ID列表
- `status`: `Enum('training', 'trained', 'failed')` - 模型当前状态
- `train_output`: `JSON` - 训练阶段相关输出,数量待定（如 `{ "metrics": {}, "pca": {}, "anomaly_score": {}, "threshold": 0.5 }`）

- `completed_at`: `DateTime` - 训练完成时间
- `created_by`: `String` - 创建人ID (发起训练的人)
- `created_at`: `DateTime` - 创建时间 (发起训练时间)
- `updated_by`: `String` - 最后一次修改人ID
- `updated_at`: `DateTime` - 最后一次更新时间
- `is_deleted`: `Boolean` - 是否已删除 (逻辑删除标记，默认 false)
- `deleted_by`: `String` - 删除操作人ID
- `deleted_at`: `DateTime` - 删除时间

### 1.4 模型验证 (Validation)
模型在不同数据集上的独立验证记录。
- `id`: `String` (UUID) - 主键
- `name`: `String` - 验证记录名称
- `workflow`: `Enum('outliers', 'regression')` - 工作流类型（冗余字段，方便查询）
- `model_id`: `String` - 被验证的模型ID (外键)
- `val_dataset_ids`: `JSON` (String Array) - 用于验证的数据集ID列表
- `status`: `Enum('validating', 'validated', 'failed')` - 验证状态
- `validation_output`: `JSON` - 验证阶段相关输出,数量待定（如 `{ "metrics": {}, "pca": {}, "anomaly_score": {}, "threshold": 0.5 }`）

- `completed_at`: `DateTime` - 验证完成时间
- `created_by`: `String` - 创建人ID (发起验证的人)
- `created_at`: `DateTime` - 创建时间 (验证发起时间)
- `updated_by`: `String` - 最后一次修改人ID
- `updated_at`: `DateTime` - 最后一次更新时间
- `is_deleted`: `Boolean` - 是否已删除 (逻辑删除标记，默认 false)
- `deleted_by`: `String` - 删除操作人ID
- `deleted_at`: `DateTime` - 删除时间

### 1.5 部署记录 (模型与记录 1:N, 能够追溯历史部署记录)
记录某个设备在特定工作流下，当前处于激活（Deployed）状态的模型。
- `id`: `String` (UUID) - 主键
- `equipment_id`: `String` - 设备ID
- `workflow`: `Enum('outliers', 'regression')` - 工作流类型
- `model_id`: `String` - 部署的模型ID
- `alarm_message`: `String` - 报警消息模板（用于触发报警时的自定义消息）
- `is_active`: `Boolean` - 是否为当前激活部署记录

- `created_by`: `String` - 创建人ID (发起部署的人)
- `created_at`: `DateTime` - 创建时间 (部署时间)
- `undeployed_at`: `DateTime` - 卸载时间 (当被替换或取消部署时记录)
- `updated_by`: `String` - 最后一次修改人ID
- `updated_at`: `DateTime` - 最后一次修改时间
> *业务规则：同一个 `equipment_id` + `workflow` 组合只能有一条激活的部署记录。*

---

## 2. API 接口定义 (RESTful APIs)

### 2.1 设备 (Devices)

#### 获取设备列表
- 5865后端
- **用途**：首页选择设备
- **接口**：`GET /ML/GetEquipments`
- **参考查询参数**：根据组织、设备名称等进行筛选
- **输出**：设备对象列表。

#### 获取设备的特征列表（后续增加工艺列表）
- 5865后端
- **用途**：`Step2` 信号样本构建页面中，获取该设备的所有特征列表
- **接口**：`GET /ML/GetEquipmentFeatures`
- **参考查询参数**：略。
- **输出**：设备特征列表。

### 2.2 数据集/信号 (`Step2`构建信号样本页面)

#### 预览特征信号
- 5865后端
- **用途**：用户点击"信号预览"按钮后，根据特征和时间范围获取原始特征序列，绘制时域图
- **接口**：`GET /ML/GetEquipmentFeatureData`
- **参考查询参数**：
  - `equipment_id`
  - `features` 特征列表
  - `start_time`, `end_time` (必填，按时间范围过滤信号)
- **输出**：
  ```json
  {
    "features": ["PointA_Temp", "PointA_Pressure"],
    "feature_series": [
      {"time": "2023-01-01T00:00:00Z", "PointA_Temp": 25.0, "PointA_Pressure": 101.325},
      {"time": "2023-01-01T00:00:01Z", "PointA_Temp": 26.0, "PointA_Pressure": 101.325},
      // ... 更多数据点
    ],
    "feature_length": 1024
  }
  ```


#### 计算PCA-即时计算，可以不入库。后续还要增加相关性分析的接口。
- 8840后端
- **用途**：用户点击"信号筛选预览"按钮后，获得特征序列后，进一步计算特征序列的PCA主成分，绘制PCA图。
- **接口**：`POST /ML/GetEquipmentFeaturePCA`
- **输入**：略
- **输出**：
  ```json
  {
    "pca": ["pca0", "pca1"],
    "pca_series": [
      {"time": "2023-01-01T00:00:00Z", "pca0": 25.0, "pca1": 101.325},
      {"time": "2023-01-01T00:00:01Z", "pca0": 26.0, "pca1": 101.325},
      // ... 更多数据点
    ],
    "pca_length": 1024
  }
  ```

#### 创建数据集 (添加信号样本)
- 5865后端
- **用途**：点击"添加信号样本"按钮，将信号样本数据的元信息和计算的PCA主成分入库
- **接口**：`POST /ML/CreateDataset`
- **输入**：
  ```json
  {
    "name": "Signal_20230101_1200", // 信号样本名称有前端按规则生成
    "equipment_id": "dev-1",
    "workflow": "outliers",
    "features": ["PointA_Temp", "PointA_Pressure"],
    "target_feature": null ,
    "start_time": "2023-01-01T00:00:00Z",
    "end_time": "2023-01-02T00:00:00Z",
    "PCA": {} 
  }
  ```

#### 获取数据集列表（前端默认对前三个执行“预览特征信号”）
- 5865后端
- **用途**：`Step2`信号样本构建页面 和 `Step3` 模型训练/验证页面中，获取当前设备和工作流下的所有信号样本数据集
- **接口**：`GET /ML/GetDatasetList`
- **参考查询参数**：
  - `equipment_id`
  - `workflow` 
  - 根据信号名、创建时间进行筛选（选填）
- **输出**：带分页的数据集对象列表（只返回一些元信息，不返回具体特征序列，具体特征序列通过“预览特征信号”接口按需延迟获取）

#### 更新数据集 (重命名)
- 5865后端
- **用途**：重命名信号样本
- **接口**：`PUT /ML/UpdateDataset`
- **参考查询参数**：
  - `dataset_id` (必填)
- **输入**：`{ "name": "New_Signal_Name" }`
- **输出**：略

#### 删除数据集
- 5865后端
- **用途**：删除信号样本
- **接口**：`DELETE /ML/DeleteDataset`
- **参考查询参数**：
  - `dataset_id`
- **输出**：`{ "success": true }`



### 2.3 模型训练 (`Step3`模型管理页面)

#### 获取模型列表（前端默认对第一个执行“获取模型详情”）（前端轮训，刷新模型状态）
- 5865后端
- **用途**：列出全部模型。
- **接口**：`GET /ML/GetModelList`
- **参考查询参数**：
  - `equipment_id`: `String` - 筛选特定设备
  - `workflow`: `Enum('outliers', 'regression')` - 筛选特定工作流
- **部分关键输出**：带分页的模型对象列表（包含模型信息、信号样本元信息、模型状态、评估指标，不包含 `train_output`中的一些长数据）。模型状态需要根据模型数据结构的状态（training、trained、failed）、验证数据结构的状态（validating、validated、failed）、部署数据结构（是否为当前激活部署的模型）综合进行判断。
  ```json
  {
    "status": "validating" // 注意这里的statu是综合判断出来的
  }
  ```


#### 获取模型训练详情
- 5865后端
- **用途**：主要用与延迟获取`train_output`中的一些长数据，按需获取这些长数据。
- **接口**：`GET /ML/GetModelDetail`
- **参考参数**：
  - `model_id` 
- **输出**：单个模型对象中`train_output`中的一些长数据。

#### 创建/修改模型
- 5865后端
- **用途**：修改模型的名称。
- **接口**：`PUT /ML/CreateOrUpdateModel`
- **输入**：`{ "model_id": "model-1", "name": "New_Model_Name" , "status":"trained"}`
- **输出**：更新后的模型对象

#### 删除模型
- 5865后端
- **用途**：删除模型。
- **接口**：`DELETE /ML/DeleteModel`
- **参考参数**：
  - `model_id`
- **输出**：`{ "success": true }` 

#### 获取预处理可选配置
- 8840后端
- **用途**：获取当前模型的预处理可选配置（如是否标准化、是否进行PCA降维）。
- **接口**：`GET /ML/GetPreprocessingConfig`
- **输出**：
  ```json
  {
  "standardization": {
      "current": true,
      "default": true,
      "type": "boolean",
      "configurable": true,
      "help": "是否进行Z-score标准化"
    },
    "pca": {
      "current": 0.95,
      "default": null,
      "type": "number",
      "configurable": true,
      "mode": "variance",                 // 或 "components" / "none"
      "variance_range": [0.5, 0.999],
      "components_range": [2, 100],
      "help": "PCA降维，可选保留方差比例或指定主成分个数"
    }
  }

  ```
#### 获取所有支持的模型及各自的可配置参数
- 8840后端
- **用途**：获取所有支持的模型及各自的可配置参数。
- **接口**：`GET /ML/GetAvailableModelsWithConfig`
- **输出**：
  ```json
  {
    "Autoencoder": {
      "standardization": true,
      "pca": 0.95
    },
    "IsolationForest": {
      "standardization": false,
      "pca": null
    }
  }
  ```

#### 发起模型训练
- 8840后端
- **用途**：创建并训练新模型
- **接口**：`POST /ML/StartModelTraining`
- **输入**：
  ```json
  {
    "name": "Model_20230101_1200",
    "equipment_id": "dev-1",
    "workflow": "outliers",
    "algorithm": "Autoencoder",
    "parameters": { "epochs": 100, "batchSize": 32, "learningRate": 0.001 },
    "preprocessing": { "standardization": true, "pca": 0 },
    "train_dataset_ids": ["sig-1", "sig-2"]
  }
  ```
- **输出**：模型对象（状态为 `training`）。前端可通过轮询或 WebSocket 监听状态变化。
- **接口具体动作**：1. 该接口内部要根据信号样本的元信息获取实际的特征序列。可以先根据dataset_ids获取信号样本的元信息，再根据元信息通过“预览特征信号”接口获取特征序列。也可以让5865后端直接根据dataset_ids获取特征序列。 2. 开始训练时，通过“创建/修改模型”接口创建一条模型记录，并标记为“training”，存入相关信息。3. 结束训练后，要通过“创建/修改模型”接口更新模型的状态为“trained”或“failed”，并存入相关信息。 

### 2.4 模型验证 (`Step3`模型管理页面)

#### 获取某个模型的验证记录（非model list）
- 5865后端
- **用途**：展示某个模型的验证记录列表
- **接口**：`GET /ML/GetValidationList`
- **参考参数**：
  - `model_id`
- **输出**：带分页的验证记录对象列表（包含信号样本元信息、评估指标，不包含 `validation_output`中的一些长数据）。
  ```json
  {
    "validation_id": 
  }
  ```

#### 获取验证详情
- 5865后端
- **用途**：当用户在 History 中点击某一条具体的验证记录时，获取该次验证的完整结果，主要是`validation_output`中的一些长数据。
- **接口**：`GET /ML/GetValidationDetail`
- **参考参数**：
  - `validation_id`
- **输出**：单个验证记录对象的完整信息，主要是`validation_output`中的一些长数据。

#### 修改验证记录
- 5865后端
- **接口**：`PUT /ML/CreateOrUpdateValidation` 
- **输入**：`{"validation_id": "val-1", "name": "New_Validation_Name" }`
- **输出**：更新后的验证记录对象

#### 删除验证记录
- 5865后端
- **接口**：`DELETE /ML/DeleteValidation`
- **参考参数**：
  - `validation_id`
- **输出**：`{ "success": true }` 

#### 发起模型验证
- 8840后端
- **用途**：使用新的未参与训练的数据集对已训练的模型进行验证
- **接口**：`POST /ML/StartModelValidation`
- **输入**：
  ```json
  {
    "name": "Validation_Test_1",
    "model_id": "model-1",
    "dataset_ids": ["sig-3"]
  }
  ```
- **输出**：验证记录对象（状态为 `validating`）。前端可通过轮询或 WebSocket 监听状态变化。
- **接口具体动作**：1. 该接口内部要根据信号样本的元信息获取实际的特征序列。可以先根据dataset_ids获取信号样本的元信息，再根据元信息通过“预览特征信号”接口获取特征序列。也可以让5865后端直接根据dataset_ids获取特征序列。 2. 开始验证时，通过“创建/修改验证记录”接口创建一条验证记录，并标记为“validating”，存入相关信息。3. 结束验证后，要通过“创建/修改验证记录”接口更新验证记录的状态为“validated”或“failed”，存入相关信息。 
- ## TODO 前端要增加信号样本重复性验证，不允许使用训练时使用的信号样本进行验证。


### 2.5 模型部署 (`Step3`模型管理页面)

#### 部署/激活模型
- 5865后端
- **用途**：将某个模型部署为该设备、该工作流下的“当前激活”模型（用于实时推断）
- **接口**：`POST /ML/DeployModel`
- **输入**：
  ```json
  {
    "equipment_id": "dev-1",
    "workflow": "outliers",
    "model_id": "model-1",
    "alarm_message": "AI Outliers Detection 告警：检测到旋转设备运行参数异常，可能存在潜在设备故障风险。请及时检查设备状态并进行必要的维护。"
  }
  ```
- **输出**：略
- **后端执行操作说明**：
  1. 查找该 `equipment_id` 和 `workflow` 组合下，当前 `is_active = true` 的旧部署记录（如果存在）。
  2. 若存在旧记录，将其 `is_active` 更新为 `false`，并记录 `undeployed_at` 为当前时间（相当于卸载旧模型，但不删除记录以保留历史）。
  3. 创建一条新的部署记录，将传入的 `model_id` 等信息入库，并设置 `is_active = true`。

#### 取消/卸载模型
- 5865后端
- **用途**：取消设备在该工作流下的当前模型部署
- **接口**：`DELETE /ML/UnDeployModel`
- **参考参数**：
  - `equipment_id` 
  - `workflow` 
  - `model_id`
- **输出**：`{ "success": true }`
- **后端执行操作说明**：
  1. 查找该 `equipment_id` 和 `workflow` 组合下，当前 `is_active = true` 的部署记录。
  2. 将该记录的 `is_active` 字段更新为 `false`，并记录 `undeployed_at` 为当前时间。
  3. **注意**：为了追溯历史部署记录，**不要**物理删除（硬删除）该记录。

#### 获取部署记录（暂时前端中还没有展示）
- 5865后端
- **用途**：根据`equipment_id` 和 `workflow`获取设备的部署记录
- **接口**：`GET /ML/GetDeploymentRecord`
- **Query 参数**：
  - `equipment_id` (必填)
  - `workflow` (必填)
- **输出**：部署记录对象（如 `{"equipment_id": "dev-1", "workflow": "outliers", "model_id": "model-1"}`）


### 2.6. 报警检测任务 (实时监控与推理工作流)
- 8840后端与5865后端协同实现

定时检测工作流说明：
8840 端配置一个全局的定时任务（Cron Job），按设定频率（如每分钟或每5分钟）周期性执行，整体工作流如下：

1. **获取当前有效部署**：8840 端调用 5865 接口（`GetAllActiveDeployments`），获取当前系统中**所有**处于激活状态（`is_active=true`）的部署记录，得知哪些设备正在使用哪些模型进行在线检测。
2. **获取模型元数据**：针对有效部署记录，8840 根据 `model_id` 调用 5865 的“获取模型详情”接口（`GetModelDetail`）。提取执行推理所需的关键信息：`features`（输入的特征列名称和顺序）、根据模型id获取模型持久化文件（持久化文件中包含了预处理参数、模型参数等）。
3. **获取设备最新数据**：8840 调用 5865 接口，根据 `equipment_id` 和 `features` 获取最新特征序列。
4. **模型推理与特征预处理**：
   - 8840 端加载对应的机器学习模型。
   - 对获取到的最新数据执行与训练阶段相同的预处理（如标准化、PCA降维等）。
   - 将处理后的数据输入模型，计算出当前时刻的一些计算量（如异常分数、预测值等）。
   - 8840 端调用 5865 接口（`CreateAlarm`），直接将计算量和`alarm_message` 等作为一条检测记录存入数据库。
5. **判定与结果存储**：
   - 将是否异常的结果和`alarm_message` 等作为一条检测记录存入。 8840 端调用 5865 接口（`CreateAlarm`）。


#### 获取所有激活的部署记录
- 5865后端
- **用途**：供 8840 定时任务获取当前系统中所有正在运行监控任务的部署记录，作为定时检测的起始依据。
- **接口**：`GET /ML/GetAllActiveDeployments`
- **输出**：
  ```json
  [
    {
      "id": "dep-1",
      "equipment_id": "dev-1",
      "workflow": "outliers",
      "model_id": "model-1",
      "alarm_message": "..."
    }
  ]
  ```

#### 获取设备最新特征数据
- 5865后端 
- **用途**：供 8840 获取执行单次推理所需的特征数据（默认为一个时刻）。
- **接口**：`POST /ML/GetLatestFeature`
- **输入**：
  ```json
  {
    "equipment_id": "dev-1",
    "features": ["PointA_Temp", "PointA_Pressure"]
      }
  ```
- **输出**：
  ```json
  {
    "data": [
      { "time": 1672531200000, "PointA_Temp": 24.1, "PointA_Pressure": 101.5 }    ]
  }
  ```

#### 推送每次检测结果（与机理模型的报警任务以隔离的？）
- 5865后端
- **用途**：8840 端把每次推理（检测）的结果写入数据库。推理中间计算量在evidence_artifacts中，在外层再暴露一个“is_alarm”字段。
- **接口**：`POST /ML/CreateAlarm`
- **输入**：
  ```json
  {
    "equipment_id": "dev-1",
    "model_id": "model-1",
    "deployment_id": "dep-1",
    "workflow": "outliers",
    "alarm_time": "2023-01-01T12:05:00Z",
    "alarm_message": "检测到旋转设备运行参数异常，可能存在潜在故障风险...",
    "trigger_value": 0.85,
    "threshold": 0.70,
    "evidence_artifacts": {
      "input_snapshot": [
        { "time": 1672531500000, "PointA_Temp": 89.5, "PointA_Pressure": 150.2 }
      ],
      "feature_contributions": { "PointA_Temp": 0.6, "PointA_Pressure": 0.4 }
    }
  }
  ```
- **输出**：创建成功的告警记录对象

#### 告警记录数据结构 (Alarm)
只记录判定为异常的**告警事件快照**。
- `id`: `String` (UUID) - 主键
- `equipment_id`: `String` - 报警所属设备ID
- `model_id`: `String` - 触发报警的模型ID
- `deployment_id`: `String` - 关联的具体部署记录ID
- `workflow`: `Enum('outliers', 'regression')` - 工作流类型
- `alarm_time`: `DateTime` - 触发告警的时间戳
- `alarm_message`: `String` - 告警消息文本（继承自部署记录的 `alarm_message`）
- `trigger_value`: `Number` - 触发告警的具体异常分数或偏差值
- `threshold`: `Number` - 判定异常的阈值基准
- `evidence_artifacts`: `JSON` - 告警现场的证据快照（例如当时输入模型的各特征值片段、各特征对异常的贡献度等，方便人工溯源排查）
- `status`: `Enum('unhandled', 'handled', 'ignored')` - 告警处理状态（默认 unhandled）
- `created_at`: `DateTime` - 记录创建时间