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
- `device_id`: `String` - 关联的设备ID (外键)
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
- `device_id`: `String` - 关联设备ID
- `workflow`: `Enum('outliers', 'regression')` - 工作流类型
- `algorithm`: `String` - 算法名称（如 "RandomForestRegressor", "Autoencoder"）
- `parameters`: `JSON` - 超参数配置（如 `{ "epochs": 100, "batchSize": 32 }`）
- `preprocessing`: `JSON` - 预处理配置（如 `{ "standardization": true, "pca": 0 }`）
- `train_features`: `JSON` (String Array) - **[核心校验字段]** 模型训练时实际使用的输入特征列名列表，严格保持顺序（例如 `["PointA_Temp", "PointA_Pressure"]`）
- `target_feature`: `String` - **[核心校验字段]** 模型预测的目标特征（仅回归任务有效）
- `status`: `Enum('training', 'trained', 'failed')` - 模型当前状态
- `metrics`: `JSON` - 模型评估指标（回归: `{ "oobR2": 0.85, "trainingR2": 0.90 }`，异常检测: `{ "roc": 0.95, "precision": 0.92 }`）
- `train_artifacts`: `JSON` / `String` - 训练阶段输出的详细产物（如数据集中每个样本的异常分数 score、计算出的报警阈值、中间 PCA 降维结果等），数据量大时可存储为 S3 URL。
- `train_dataset_ids`: `JSON` (String Array) - 训练使用的数据集ID列表
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
- `model_id`: `String` - 被验证的模型ID (外键)
- `dataset_ids`: `JSON` (String Array) - 用于验证的数据集ID列表
- `workflow`: `Enum('outliers', 'regression')` - 工作流类型（冗余字段，方便查询）
- `status`: `Enum('validating', 'validated', 'failed')` - 验证状态
- `metrics`: `JSON` - 验证结果指标（结构同模型 metrics）
- `validation_artifacts`: `JSON` / `String` - 验证阶段输出的详细产物（如测试集中每个样本的预测值、残差、异常分数等），数据量大时可存储为 S3 URL。
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
- `device_id`: `String` - 设备ID
- `workflow`: `Enum('outliers', 'regression')` - 工作流类型
- `model_id`: `String` - 部署的模型ID
- `alarm_message`: `String` - 报警消息模板（用于触发报警时的自定义消息）
- `is_active`: `Boolean` - 是否为当前激活部署记录
- `created_by`: `String` - 创建人ID (发起部署的人)
- `created_at`: `DateTime` - 创建时间 (部署时间)
- `undeployed_at`: `DateTime` - 卸载时间 (当被替换或取消部署时记录)
- `updated_by`: `String` - 最后一次修改人ID
- `updated_at`: `DateTime` - 最后一次修改时间
> *业务规则：同一个 `device_id` + `workflow` 组合只能有一条激活的部署记录。*

---

## 2. API 接口定义 (RESTful APIs)

> **全局说明**：
> - 接口路径前缀统一为 `/ML`
> - 请求和响应内容类型均为 `application/json`
> - 所有列表查询接口均支持统一的分页结构，返回格式如下：
>   ```json
>   {
>     "data": [...],
>     "meta": {
>       "total": 100,
>       "page": 1,
>       "size": 20,
>       "total_pages": 5
>     }
>   }
>   ```

### 2.1 设备 (Devices)

#### 获取设备列表
- 5865后端
- **用途**：首页选择设备
- **接口**：`GET /ML/devices`
- **Query 参数 (选填)**：`page`, `size`, `keyword` (支持按设备名/编码模糊搜索)
- **输出**：带分页的设备对象列表。

#### 获取设备的特征列表（后续增加工艺列表）
- 5865后端
- **用途**：`Step2` 信号样本构建页面中，获取该设备的所有特征列表
- **接口**：`GET /ML/devices/features`
- **Query 参数**：
  - `device_id` (必填)
- **输出**：
  ```json
  {
    "features": [
      "PointA_Temp",
      "PointA_Pressure",
      ...
    ]
  }
  ```
### 2.2 数据集/信号 (Datasets)

#### 预览特征信号
- 5865后端
- **用途**：`Step2`，用户点击"信号预览"按钮后，根据特征和时间范围获取原始特征序列，绘制时域图
- **接口**：`GET /ML/datasets/preview`
- **Query 参数**：
  - `device_id` (必填)
  - `features` (必填，逗号分隔)
  - `start_time`, `end_time` (必填，按时间范围过滤信号)
- **输出**：
  ```json
  {
    "data": [
      { "time": 1, "PointA_Temp": 23.5, "PointA_Pressure": 101.2 },
      ...
    ]
  }
  ```

#### 计算PCA-即时计算，不入库
- 5865后端或者前端或者8840
- **用途**：在`Step2`页面中，用户点击"信号预览"按钮后，计算原始特征序列的PCA主成分，绘制PCA图
- **接口**：`POST /ML/datasets/pca`
- **输入**：无
- **输出**：
  ```json
  {
    "pca": {
      "components": [
        { "PC1": 0.707, "PC2": 0.707 },
        ...
      ],
      "explained_variance_ratio": [0.5, 0.3, 0.2]
    }
  }
  ```

#### 获取数据集列表（前端默认对前三个执行“预览特征信号”）
- 5865后端
- **用途**：`Step2`信号样本构建页面 和 `Step3` 模型训练/验证页面中，获取当前设备和工作流下的所有信号样本数据集
- **接口**：`GET /ML/datasets/GetDatasetList`
- **Query 参数**：
  - `device_id` (必填)
  - `workflow` (必填)
  - `page`, `size` (选填)
  - `start_time`, `end_time` (选填，按时间范围过滤数据集)
- **输出**：带分页的数据集对象列表（不包含具体时序数据、包含2D_PCA_DATA）

#### 更新数据集 (重命名)
- 5865后端
- **用途**：`Step2` 页面中重命名信号
- **接口**：`PUT /ML/datasets/UpdateDataset`
- **Query 参数**：
  - `dataset_id` (必填)
- **输入**：`{ "name": "New_Signal_Name" }`
- **输出**：更新后的数据集对象

#### 删除数据集
- 5865后端
- **用途**：`Step2` 页面中删除信号
- **接口**：`DELETE /ML/DeleteDataset`
- **Query 参数**：
  - `dataset_id` (必填)
- **输出**：`{ "success": true }`

#### 创建数据集 (添加信号)
- 5865后端
- **用途**：`Step2`页面中，用户选择特征、时间范围后，点击"Add Signal"按钮，将信号样本数据的元信息和计算的PCA主成分入库
- **接口**：`POST /ML/CreateDataset`
- **输入**：
  ```json
  {
    "name": "Signal_20230101_1200",
    "device_id": "dev-1",
    "workflow": "outliers",
    "start_time": "2023-01-01T00:00:00Z",
    "end_time": "2023-01-02T00:00:00Z",
    "features": ["PointA_Temp", "PointA_Pressure"],
    "target_feature": null ,
    "PCA": {} 
  }
  ```

### 2.3 模型训练与管理 (Models)

#### 获取模型列表（前端默认对第一个执行“获取模型详情”）（前段轮训，刷新模型状态）
- 5865后端
- **用途**：在`Step3`页面的3个Tab页中，列出全部模型。
- **接口**：`GET /ML/GetModelList`
- **Query 参数 (选填)**：
  - `device_id`: `String` - 筛选特定设备
  - `workflow`: `Enum('outliers', 'regression')` - 筛选特定工作流
  <!-- - `status`: `String` - 按状态筛选 (如 `'training'、'trained'、'failed'`)
  - `has_validations`: `Boolean` - 是否有成功的验证记录
  - `is_deployed`: `Boolean` - 是否为当前激活部署的模型 -->
  - `page`: `Integer` (默认 1)
  - `size`: `Integer` (默认 20)
<!-- - **业务场景参数设置示例**：
  - **(Train / Validation 阶段)**：获取该设备和工作流下的所有历史模型（包含正在训练、已训练完成、失败的模型）。
    `GET /ML/models?device_id=dev-1&workflow=outliers&page=1&size=20`
  - **(Deployment 部署阶段)**：只获取已训练完成，**且**至少经过一次验证的“可部署”模型。
    `GET /ML/models?device_id=dev-1&workflow=outliers&status=trained&has_validations=true&page=1&size=20` -->
- **输出**：带分页的模型对象列表（包含基础信息、状态和评估指标，不包含 `train_artifacts`）。模型状态需要根据模型数据结构、验证数据结构、部署数据结构综合进行判断。


#### 获取模型训练详情
- 5865后端
- **用途**：模型信息、信号元信息、指标、2D/3D PCA主成分（非实际信号预处理时的PCA）、异常分数、阈值等训练阶段输出的产物train_artifacts。
- **接口**：`GET /ML/GetModelDetail`
- **Query 参数**：
  - `model_id` (必填)
- **输出**：单个模型对象完整信息

#### 创建/修改模型
- 5865后端
- **用途**：`Step3` 页面中，修改模型的名称。
- **接口**：`PUT /ML/CreateOrUpdateModel`
- **输入**：`{ "model_id": "model-1", "name": "New_Model_Name" , "status":"trained"}`
- **输出**：更新后的模型对象

#### 删除模型
- 5865后端
- **用途**：`Step3` 页面中，删除模型。
- **接口**：`DELETE /ML/DeleteModel`
- **Query 参数**：
  - `model_id` (必填)
- **输出**：`{ "success": true }` 

#### 获取预处理可选配置
- 8840后端
- **用途**：`Step3` 页面中，获取当前模型的预处理可选配置（如是否标准化、是否进行PCA降维）。
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
- **用途**：`Step3` 页面中，获取所有支持的模型及各自的可配置参数。
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
- **用途**：`Step3` 页面中创建并训练新模型
- **接口**：`POST /ML/StartModelTraining`
- **输入**：
  ```json
  {
    "name": "Model_20230101_1200",
    "device_id": "dev-1",
    "workflow": "outliers",
    "algorithm": "Autoencoder",
    "parameters": { "epochs": 100, "batchSize": 32, "learningRate": 0.001 },
    "preprocessing": { "standardization": true, "pca": 0 },
    "train_dataset_ids": ["sig-1", "sig-2"]
  }
  ```
- **输出**：模型对象（状态为 `training`）。前端可通过轮询或 WebSocket 监听状态变化。
- **TODO**：1. 该接口内部要根据信号样本的元信息获取实际的特征序列。可以先根据dataset_ids获取信号样本的元信息，再根据元信息通过“预览特征信号”接口获取特征序列。也可以让5865后端直接根据dataset_ids获取特征序列。 2. 开始训练时，通过“创建/修改模型”接口创建一条模型记录，并标记为“training”。3. 结束训练后，要通过“创建/修改模型”接口更新模型的状态为“trained”或“failed”。 

### 2.4 模型验证 (Validations)

#### 获取某个模型的验证记录（非model list）
- 5865后端
- **用途**：展示某个模型的历史验证记录列表，是轻量级数据，不包含 validation_artifacts
- **接口**：`GET /ML/GetValidationList`
- **Query 参数**：
  - `model_id` (必填)
  - `page`, `size` (选填)
- **输出**：带分页的验证记录对象列表（可以不包含 `validation_artifacts` 字段）。

#### 获取验证详情
- 5865后端
- **用途**：当用户在 Validation 列表中点击某一条具体的验证记录时，获取该次验证的完整结果，包含validation_artifacts。
- **接口**：`GET /ML/GetValidationDetail`
- **Query 参数**：
  - `validation_id` (必填)
- **输出**：单个验证记录对象的完整信息（包含 `validation_artifacts`）。

#### 修改验证记录
- 5865后端
- **接口**：`PUT /ML/CreateOrUpdateValidation` 
- **输入**：`{"validation_id": "val-1", "name": "New_Validation_Name" }`
- **输出**：更新后的验证记录对象

#### 删除验证记录
- 5865后端
- **接口**：`DELETE /ML/DeleteValidation`
- **Query 参数**：
  - `validation_id` (必填)
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
- **TODO**：1. 该接口内部要根据信号样本的元信息获取实际的特征序列。可以先根据dataset_ids获取信号样本的元信息，再根据元信息通过“预览特征信号”接口获取特征序列。也可以让5865后端直接根据dataset_ids获取特征序列。 2. 开始验证时，通过“创建/修改验证记录”接口创建一条验证记录，并标记为“validating”。3. 结束验证后，要通过“创建/修改验证记录”接口更新验证记录的状态为“validated”或“failed”。 


### 2.5 模型部署 (Deployments)

#### 部署/激活模型
- 5865后端
- **用途**：将某个模型部署为该设备、该工作流下的“当前激活”模型（用于实时推断）
- **接口**：`POST /ML/DeployModel`
- **输入**：
  ```json
  {
    "device_id": "dev-1",
    "workflow": "outliers",
    "model_id": "model-1",
    "alarm_message": "AI Outliers Detection 告警：检测到旋转设备运行参数异常，可能存在潜在设备故障风险。请及时检查设备状态并进行必要的维护。"
  }
  ```
- **输出**：部署记录对象。
- **后端执行操作说明**：
  1. 查找该 `device_id` 和 `workflow` 组合下，当前 `is_active = true` 的旧部署记录（如果存在）。
  2. 若存在旧记录，将其 `is_active` 更新为 `false`，并记录 `undeployed_at` 为当前时间（相当于卸载旧模型，但不删除记录以保留历史）。
  3. 创建一条新的部署记录，将传入的 `model_id` 等信息入库，并设置 `is_active = true`。

#### 取消/卸载模型
- 5865后端
- **用途**：取消设备在该工作流下的当前模型部署
- **接口**：`DELETE /ML/UnDeployModel?device_id=dev-1&workflow=outliers`
- **输出**：`{ "success": true }`
- **后端执行操作说明**：
  1. 查找该 `device_id` 和 `workflow` 组合下，当前 `is_active = true` 的部署记录。
  2. 将该记录的 `is_active` 字段更新为 `false`，并记录 `undeployed_at` 为当前时间。
  3. **注意**：为了追溯历史部署记录，**不要**物理删除（硬删除）该记录。

#### 获取部署记录
- 5865后端
- **用途**：根据`device_id` 和 `workflow`获取设备的部署记录
- **接口**：`GET /ML/GetDeploymentRecord`
- **Query 参数**：
  - `device_id` (必填)
  - `workflow` (必填)
- **输出**：部署记录对象（如 `{"device_id": "dev-1", "workflow": "outliers", "model_id": "model-1"}`）


### 2.6. 报警检测任务 (实时监控与推理工作流)
- 8840后端与5865后端协同实现

定时检测工作流说明：
8840 端配置一个全局的定时任务（Cron Job），按设定频率（如每分钟或每5分钟）周期性执行，整体工作流如下：

1. **获取当前有效部署**：8840 端调用 5865 接口（`GetAllActiveDeployments`），获取当前系统中**所有**处于激活状态（`is_active=true`）的部署记录，得知哪些设备正在使用哪些模型进行在线检测。
2. **获取模型元数据**：针对每一条部署记录，8840 根据 `model_id` 调用 5865 的“获取模型详情”接口（`GetModelDetail`）。提取执行推理所需的关键信息：`train_features`（输入的特征列名称和顺序）、`preprocessing`（预处理配置）、模型文件路径，以及训练时计算出的判定阈值（记录在 `train_artifacts` 中）。
3. **获取设备最新数据**：8840 调用 5865 接口（或直接查询时序数据库），根据 `device_id` 和 `train_features` 获取过去一个时间窗口内（与模型要求的时间步长一致）的最新的源特征序列。
4. **模型推理与特征预处理**：
   - 8840 端加载对应的机器学习模型。
   - 对获取到的最新数据执行与训练阶段相同的预处理（如标准化、PCA降维等）。
   - 将处理后的数据输入模型，计算出当前时间片段的**异常分数**（针对 outliers 工作流）或**预测值**（针对 regression 工作流）。
5. **判定与结果存储**：
   - **记录推理历史**：将本次推理的连续结果（包括原始数据时间戳、推理分数、残差等，类似于 `validation_artifacts`）直接写入**时序数据库**（此步骤数据量较大，不应存入关系型数据库，后续可供前端实时监控图表查询，本篇暂不详细展开）。
   - **阈值判定与告警**：将推理得出的异常分数或误差与模型设定的阈值进行比较。**如果超出阈值**，则代表检测到异常，8840 端调用 5865 接口（`CreateAlarm`）在关系型数据库中生成一条**告警记录 (Alarm)**，并将该次检测的关键现场证据一并保存，告警消息采用部署记录中配置的 `alarm_message` 模板。


#### 获取所有激活的部署记录
- 5865后端
- **用途**：供 8840 定时任务获取当前系统中所有正在运行监控任务的部署记录，作为定时检测的起始依据。
- **接口**：`GET /ML/GetAllActiveDeployments`
- **输出**：
  ```json
  [
    {
      "id": "dep-1",
      "device_id": "dev-1",
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
    "device_id": "dev-1",
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
    "device_id": "dev-1",
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
- `device_id`: `String` - 报警所属设备ID
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