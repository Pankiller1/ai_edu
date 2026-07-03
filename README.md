# 基于大语言模型的个性化学习辅导系统

> **AI-Powered Personalized Learning Tutoring System**

面向智慧教育场景，利用大语言模型（LLM）实现题目自动解析、个性化解题辅导、类似题生成与学习历史记录的 demo 系统。

---

## 系统功能

| 功能模块 | 描述 |
|---|---|
| **题目上传** | 支持文字输入或图片上传，提交待解析题目 |
| **AI 解题** | 调用 LLM 自动解析题目，输出分步解题过程 |
| **类似题生成** | 根据学生答题错误情况，生成同类型、同难度的练习题 |
| **学习历史** | 记录每道题的题目内容、解题结果、错误标记，支持回顾 |

---

## 系统架构

```
┌─────────────────────────────────────────────────────┐
│                 用户界面层（React 前端）               │
│       题目上传 · 解题展示 · 练习题交互 · 历史查看      │
└──────────────────────┬──────────────────────────────┘
                       │  HTTP 请求 / 响应
┌──────────────────────▼──────────────────────────────┐
│              后端服务层（Node.js / FastAPI）           │
│       请求路由 · Prompt 构建 · 响应解析 · 记录管理     │
└───────────┬──────────────────────────┬──────────────┘
            │                          │
┌───────────▼──────────┐  ┌────────────▼──────────────┐
│     LLM 调用模块           │  │       本地存储模块          │
│  DeepSeek API + Mimo v2.5  │  │       JSON 文件存储         │
│  ① 图片识别（Mimo）        │  │  ① 历史题目 + 答题结果     │
│  ② 题目解析+步骤生成       │  │  ② 错误题标记 + 科目分类   │
│  ③ 错误分析+类似题生成     │  │                             │
└──────────────────────┘  └───────────────────────────┘
```

---

## 核心流程

```
学生上传题目（文字或图片）
     │
     ▼
图片题目 → Mimo v2.5 API 识别文字
     │
     ▼
后端构建 Prompt → 调用 DeepSeek API
     │
     ▼
返回分步解题过程（展示给学生）
     │
     ▼
学生提交答案
     │
     ├── 答对 → 记录正确，推荐下一题
     │
     └── 答错 → 调用 LLM 生成类似练习题 → 记录错误标记
     │
     ▼
写入本地存储（学习历史）
```

---

## 技术栈

| 层次 | 技术选型 | 说明 |
|---|---|---|
| 前端 | React + Tailwind CSS | 单页面应用，对话式交互界面 |
| 后端 | Node.js（Express）或 Python（FastAPI） | 处理 API 路由与 Prompt 构建 |
| LLM | DeepSeek API | 解题、错误分析、类似题生成 |
| 存储 | JSON 文件 / localStorage | 轻量本地持久化，无需数据库 |
| 图片解析 | Mimo v2.5 API | 支持手写题目图片识别 |

---

## 目录结构

```
project/
├── frontend/               # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadPanel.jsx      # 题目上传组件
│   │   │   ├── SolutionView.jsx     # 解题步骤展示
│   │   │   ├── PracticePanel.jsx    # 类似题练习
│   │   │   └── HistoryList.jsx      # 学习历史记录
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/                # 后端服务
│   ├── server.js           # Express 服务入口
│   ├── routes/
│   │   ├── solve.js        # 解题接口
│   │   ├── practice.js     # 类似题生成接口
│   │   └── history.js      # 学习历史接口
│   ├── prompts/
│   │   ├── solve.txt       # 解题 Prompt 模板
│   │   └── practice.txt    # 类似题 Prompt 模板
│   └── data/
│       └── history.json    # 学习历史本地存储
│
├── README.md
└── demo-video.mp4          # 演示视频（提交时附上）
```

---

## 运行说明

### 环境要求

- Node.js >= 18
- DeepSeek API Key + Mimo v2.5 API Key（需在 `.env` 中配置）

### 启动步骤

```bash
# 1. 克隆项目
git clone <repo-url>
cd project

# 2. 配置 API Key
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入：
#   DEEPSEEK_API_KEY=your_deepseek_key_here
#   MIMO_API_KEY=your_mimo_key_here

# 3. 安装所有依赖（根目录）
npm install
npm run install:all

# 4. 一键启动前后端
npm run dev
# 后端 → http://localhost:3001
# 前端 → http://localhost:5173

# ---- 或者分开启动（两个终端）----
# 终端 1 — 后端
cd backend
npm install
node server.js

# 终端 2 — 前端
cd frontend
npm install
npm run dev
```

### 演示步骤

1. 打开浏览器访问 `http://localhost:5173`
2. 在上传区域输入一道题目（文字或图片）
3. 点击「AI 解题」，等待分步解题过程展示
4. 在答题框中提交答案
5. 如答错，系统自动生成类似练习题
6. 点击左侧「学习历史」查看做题记录

---

## Prompt 设计说明

### 解题 Prompt

```
你是一名耐心、善于引导的学科辅导老师。学生会提交一道题目（可能附有图片）。请你：

1. 判断题目所属的【学科与题型】以及涉及的【知识点】；
2. 给出清晰的【分步解题过程】，每一步包含「步骤标题」和「详细说明（含思路）」；
3. 给出【最终答案】（尽量简短规范，例如一个数值或表达式，便于自动判分）；
4. 给出一句简短的【总结】。

语气要简洁、友好，适合中学生理解。

请严格以 JSON 格式输出，结构如下：
{
  "questionType": "学科/题型与知识点概述",
  "knowledgePoints": ["知识点1", "知识点2"],
  "steps": [
    { "title": "步骤1标题", "detail": "这一步的详细说明与思路" }
  ],
  "finalAnswer": "最终答案（简短规范）",
  "summary": "一句话总结"
}
```

### 类似题生成 Prompt

```
学生在下面的题目中出现了错误，需要巩固练习。请根据原题，生成 2 道与原题【类型相同、难度相近】的练习题。

【原题】
{question}

【学生答案】{student_answer}
【正确答案】{correct_answer}

要求：
- 只输出题目文本，不输出答案与解析；
- 题目要规范、完整、可独立作答；
- 难度与原题接近，不要过难或过易；
- 两道题要有一定变化，避免与原题雷同。

请严格以 JSON 格式输出，结构如下：
{
  "questions": [
    "第1道练习题的完整题目文本",
    "第2道练习题的完整题目文本"
  ]
}
```

