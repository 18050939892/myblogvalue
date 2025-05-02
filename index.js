import 'dotenv/config';
import express from 'express';
import cors from 'cors';
const app = express();
const port = process.env.PORT || 3000;
import { MongoClient } from 'mongodb'
// 启用 JSON 解析中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 设置静态文件目录
app.use(express.static('public'));
app.use(express.json());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: '*'
}));


// 创建一个简单的首页路由
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>我的简陋服务器</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
          }
          h1 { color: #333; }
          .container { 
            border: 1px solid #ddd; 
            padding: 20px;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>欢迎访问我的服务器！</h1>
          <p>这是部署在 Railway 上的简陋服务器。</p>
          <p>当前时间: ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `);
});

// 添加一个 API 示例端点
app.get('/api/info', (req, res) => {
  res.json({
    name: '简陋服务器',
    version: '1.0.0',
    status: 'running',
    time: new Date().toISOString()
  });
});


app.get('/blog', async (req, res) => {
  const MONGODB_URI = process.env.MONGODB_URI;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const database = client.db("blog");
  const blog = database.collection("blog");

  const allBlogs = await blog.find({}).toArray();

  return res.status(200).json({
    success: true,
    message: "获取所有评论成功",
    comments: allBlogs
  });
});

app.post('/blog', async (req, res) => {
  const data = req.body;
  const { slug, updates , update} = data;
  const MONGODB_URI = process.env.MONGODB_URI;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const database = client.db("blog");
  const blog = database.collection("blog");

  const commentWithDate = {
    content:updates.content,
    ...updates.frontmatter,

  };
    updates.frontmatter.pubDatetime = new Date(updates.frontmatter.pubDatetime);
    await blog.insertOne(commentWithDate);


  return res.status(200).json({
    success: true,
    message: `创建成功`,
  });
});
app.put('/blog', async (req, res) => {
  const data = req.body;
  const { slug, updates , update} = data;
  const MONGODB_URI = process.env.MONGODB_URI;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const database = client.db("blog");
  const blog = database.collection("blog");


    const oldPubDatetime = await blog.find({title:updates.frontmatter.title}).toArray();
    updates.frontmatter.modDatetime = new Date(updates.frontmatter.pubDatetime);
    updates.frontmatter.pubDatetime = new Date(oldPubDatetime[0].pubDatetime);
    await blog.updateOne(
      { title: updates.frontmatter.title}, // 查询条件，找到要更新的文档
      {  $set: {...updates.frontmatter,content:updates.content }} // 将新评论添加到评论数组
    );

  return res.status(200).json({
    success: true,
    message: `编辑成功`,
  });
});

app.get('/comments', async (req, res) => {
  const MONGODB_URI = process.env.MONGODB_URI;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const database = client.db("blog");
  const comments = database.collection("comments");

  const allComments = await comments.find({}).toArray();

  return res.status(200).json({
    success: true,
    message: "获取所有评论成功",
    comments: allComments
  });
});

app.post('/comments', async (req, res) => {
  const MONGODB_URI = process.env.MONGODB_URI;
  const newComment = req.body;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const database = client.db("blog");
  const comments = database.collection("comments");
  const commentWithDate = {
    ...newComment,
    date: new Date().toISOString(),
  };

  // 添加新评论
  await comments.insertOne(commentWithDate);
  return res.status(200).json({
    success: true,
    message: "更新成功",
  });
});





// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
