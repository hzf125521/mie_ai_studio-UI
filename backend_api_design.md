# 智能模型工作站 (MIE AI Studio) 后端开发文档

本文档基于前端项目分析，重新设计了适用于生产环境的后端数据结构和 RESTful API 接口。

## 1. 数据结构设计 (Data Model Design)

> **注意**：针对时序数据（Signal Data），关系型数据库不适合存储海量数据点。建议将核心实体元数据存储在关系型数据库（如 MySQL/PostgreSQL），而实际的时序数据存储在时序数据库（如 InfluxDB, TDengine）或对象存储（S3, MinIO）中。

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
- `data_path`: `String` - 时序数据的存储路径（如 S3 URL 或 TSDB 的表名）
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

### 1.5 部署记录 (Deployment)
记录某个设备在特定工作流下，当前处于激活（Deployed）状态的模型。
- `id`: `String` (UUID) - 主键
- `device_id`: `String` - 设备ID
- `workflow`: `Enum('outliers', 'regression')` - 工作流类型
- `model_id`: `String` - 部署的模型ID（为 null 表示卸载/无部署）
- `deployed_by`: `String` - 部署操作人ID
- `deployed_at`: `DateTime` - 部署时间
- `updated_by`: `String` - 最后一次修改人ID
- `updated_at`: `DateTime` - 最后一次修改时间
- `is_deleted`: `Boolean` - 是否已删除 (逻辑删除标记，代表该部署记录被废弃/覆盖)
- `deleted_by`: `String` - 删除操作人ID
- `deleted_at`: `DateTime` - 删除时间
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

#### 获取数据集列表（前端默认对前三个执行“获取数据集的时序数据明细”）
- 5865后端
- **用途**：`Step2`信号样本构建页面 和 `Step3` 模型训练/验证页面中，获取当前设备和工作流下的所有信号样本数据集
- **接口**：`GET /ML/datasets`
- **Query 参数**：
  - `device_id` (必填)
  - `workflow` (必填)
  - `page`, `size` (选填)
  - `start_time`, `end_time` (选填，按时间范围过滤数据集)
- **输出**：带分页的数据集对象列表（不包含具体时序数据）

#### 更新数据集 (重命名)
- 5865后端
- **用途**：`Step2` 页面中重命名信号
- **接口**：`PUT /ML/datasets/{id}`
- **输入**：`{ "name": "New_Signal_Name" }`
- **输出**：更新后的数据集对象

#### 删除数据集
- 5865后端
- **用途**：`Step2` 页面中删除信号
- **接口**：`DELETE /ML/datasets/{id}`
- **输出**：`{ "success": true }`

#### 获取数据集的时序数据明细
- 5865后端
- **用途**：`Step2` 页面中，获取某个信号样本数据集的 源信号信息 和PCA数据。源信号信息通过“预览特征信号”接口获取原始特征序列。
- **接口**：`GET /ML/datasets/detail`
- **Query 参数**：
  - `dataset_id` (必填)
- **输出**：
  ```json
  {
    "data": [
      { "time": 1, "PointA_Temp": 23.5, "PointA_Pressure": 101.2, "anomalyScore": 0.1, "type": "Normal" },
      ...
    ]
  }
  ```
#### 创建数据集 (添加信号)
- 5865后端
- **用途**：`Step2`页面中，用户选择特征、时间范围后，点击"Add Signal"按钮，将信号样本数据的元信息和计算的PCA主成分入库
- **接口**：`POST /ML/datasets`
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
- **用途**：在`Step3`页面的“训练Tab”和“验证Tab”中，用户查看全部模型。或在`Step4`的部署页中只查看满足部署条件的模型。
- **接口**：`GET /ML/GetModelList`
- **Query 参数 (选填)**：
  - `device_id`: `String` - 筛选特定设备
  - `workflow`: `Enum('outliers', 'regression')` - 筛选特定工作流
  - `status`: `String` - 按状态筛选 (如 `'training'、'trained'、'failed'`)
  - `has_validations`: `Boolean` - 是否必须有关联的验证记录 (用于部署页过滤)
  - `is_deployed`: `Boolean` - 是否为当前激活部署的模型
  - `page`: `Integer` (默认 1)
  - `size`: `Integer` (默认 20)
- **业务场景参数设置示例**：
  - **Step 3 (Train / Validation 阶段)**：获取该设备和工作流下的所有历史模型（包含正在训练、已训练完成、失败的模型）。
    `GET /ML/models?device_id=dev-1&workflow=outliers&page=1&size=20`
  - **Step 4 (Deployment 部署阶段)**：只获取已训练完成，**且**至少经过一次验证的“可部署”模型。
    `GET /ML/models?device_id=dev-1&workflow=outliers&status=trained&has_validations=true&page=1&size=20`
- **输出**：带分页的模型对象列表（包含基础信息、状态和评估指标，不包含 `train_artifacts`）。

#### 获取模型详情
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

#### 修改验证记录、
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
- **用途**：将某个模型部署为该设备、该工作流下的“当前激活”模型（用于实时推断）
- **接口**：`POST /ML/deployments`
- **输入**：
  ```json
  {
    "device_id": "dev-1",
    "workflow": "outliers",
    "model_id": "model-1"
  }
  ```
- **输出**：部署记录对象。

#### 卸载模型
- **用途**：取消设备在该工作流下的当前模型部署
- **接口**：`DELETE /ML/deployments?device_id=dev-1&workflow=outliers`
- **输出**：`{ "success": true }`

#### 获取当前部署状态
- **用途**：应用初始化时，获取所有设备当前的部署状态
- **接口**：`GET /ML/deployments`
- **输出**：部署记录列表（如 `[{"device_id": "dev-1", "workflow": "outliers", "model_id": "model-1"}]`）
