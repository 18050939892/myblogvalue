import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// import COS from 'cos-nodejs-sdk-v5';

// 下面是交易平台的
import AV from 'leancloud-storage';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
dotenv.config();
AV.init({
  appId: process.env.LEANCLOUD_APP_ID,
  appKey: process.env.LEANCLOUD_APP_KEY,
  serverURL: process.env.LEANCLOUD_SERVER_URL
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 下面是腾讯云的交易平台
// const cos = new COS({
//   SecretId: process.env.COS_SECRET_ID,
//   SecretKey: process.env.COS_SECRET_KEY,
// });
// const Bucket = process.env.COS_BUCKET;
// const Region = process.env.COS_REGION;
// const cosRouter = express.Router();




const app = express();

// （交易平台的）临时存储上传的文件
const upload = multer({ dest: 'uploads/' });
const apiRouter = express.Router();



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
  try{
    await client.connect();
    const database = client.db("blog");
    const blog = database.collection("blog");

    const allBlogs = await blog.find({}).toArray();

    return res.status(200).json({
      success: true,
      message: "获取所有评论成功",
      comments: allBlogs
    });
  }finally {
    await client.close();
  }

});

app.post('/blog', async (req, res) => {
  const data = req.body;
  const { slug, updates , update} = data;
  const MONGODB_URI = process.env.MONGODB_URI;
  const client = new MongoClient(MONGODB_URI);
  try{
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
  }finally {
    await client.close();
  }

});
app.put('/blog', async (req, res) => {
  const data = req.body;
  const { slug, updates , update} = data;
  const MONGODB_URI = process.env.MONGODB_URI;
  const client = new MongoClient(MONGODB_URI);
  try{
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
  }finally {
    await client.close();
  }

});

app.get('/comments', async (req, res) => {
  const MONGODB_URI = process.env.MONGODB_URI;
  const client = new MongoClient(MONGODB_URI);
  try{
    await client.connect();
    const database = client.db("blog");
    const comments = database.collection("comments");

    const allComments = await comments.find({}).toArray();

    return res.status(200).json({
      success: true,
      message: "获取所有评论成功",
      comments: allComments
    });
  }finally {
    await client.close();
  }

});

app.post('/comments', async (req, res) => {
  const MONGODB_URI = process.env.MONGODB_URI;
  const newComment = req.body;
  const client = new MongoClient(MONGODB_URI);
  try{
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
  }finally {
    await client.close();
  }

});




// 获取数据列表
apiRouter.get('/AllGoods', async (req, res) => {
  try {
    const query = new AV.Query('AllGoods');
    const results = await query.find();
    res.json(results.map(item => ({
      id: item.id,
      ...item.toJSON()
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
apiRouter.get('/myCount', async (req, res) => {
  try {
    const { name } = req.query;
    const query = new AV.Query('Publisher');
    query.equalTo('name',name)
    const result = await query.first();
    res.json({
      id: result.id,
      ...result.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
apiRouter.get('/myOrder', async (req, res) => {
  try {
    const { name } = req.query;
    const query = new AV.Query('Order');
    query.equalTo('orderMaster',name)
    const results = await query.find();
    res.json(results.map(item => ({
      id: item.id,
      ...item.toJSON()
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
apiRouter.put('/myOrder', async (req, res) => {
  try {
    const { state,id } = req.body;
    const item = AV.Object.createWithoutData('Order', id);

    item.set('state',state);

    await item.save();
    res.json({
      id: item.id,
      ...item.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


apiRouter.put('/myMoney', async (req, res) => {
  try {
    const { money,id,type } = req.body;
    const item = AV.Object.createWithoutData('Publisher', id);

    await item.fetch().then(async (result) => {
      const currentMoney = item.get('money') || 0;
      item.set('money',
        type === 'add' ? (currentMoney + money) : (currentMoney - money));
      return item.save();
    })

    res.json({
      id: item.id,
      ...item.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


apiRouter.put('/addComment', async (req, res) => {
  try {
    const { comment,id } = req.body;
    const item = AV.Object.createWithoutData('AllGoods', id);

    await item.fetch().then(async (result) => {
      const currentMoney = item.get('comment') || [];
      item.set('comment',[...currentMoney, comment]);
      return item.save();
    })

    res.json({
      id: item.id,
      ...item.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.delete('/myGoods', async (req, res) => {
  try {
    const { id } = req.body;
    const item = AV.Object.createWithoutData('AllGoods', id);
    await item.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



apiRouter.delete('/myOrder', async (req, res) => {
  try {
    const { id } = req.body;
    const item = AV.Object.createWithoutData('Order', id);
    await item.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 首先，需要使用正确的中间件设置来处理两个文件
// const upload = multer({
//   dest: 'uploads/' // 或者你可以使用storage配置
// });

apiRouter.post('/AddGoods', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: '没有上传图片' });
    }

    // 读取文件内容
    const data = fs.readFileSync(file.path);

    // 创建 AV.File 对象
    const fileName = `product_${Date.now()}${path.extname(file.originalname)}`;
    const avFile = new AV.File(fileName, { base64: Buffer.from(data).toString('base64') });

    // 保存文件到云端
    const savedFile = await avFile.save();

    // 获取其他商品信息
    const { goodsName, des, type, money,publisher,headImg,senderId } = req.body;

    // 创建新的商品对象
    const AllGoods = AV.Object.extend('AllGoods');
    const goods = new AllGoods();
    const headImgPointer = AV.Object.createWithoutData('Publisher', headImg);
    await headImgPointer.fetch().then(async (result) => {
      const currentHeadImg = result.get('headImg');
      goods.set('headImg', currentHeadImg); // 保存文件对象引用
    })
    // 设置商品属性
    goods.set('goods', goodsName);
    goods.set('des', des);
    goods.set('senderId', senderId);
    goods.set('type', type);
    goods.set('publisher', publisher);
    goods.set('money', parseFloat(money));
    goods.set('picnic', savedFile); // 保存文件对象引用

    // 保存商品到数据库
    const result = await goods.save();
    fs.unlinkSync(file.path);

    // 返回成功结果
    res.status(201).json({
      id: result.id,
      ...result.toJSON(),
      message: '商品添加成功'
    });

  } catch (error) {
    console.error('添加商品失败:', error);
    res.status(500).json({ error: error.message });
  }
});



apiRouter.put('/changeGoods', upload.single('file'), async (req, res) => {
  try {
    const { goodsName, des, type, money,id } = req.body;

    // 创建新的商品对象
    const goods = AV.Object.createWithoutData('AllGoods', id);
    // 设置商品属性
    goodsName?goods.set('goods', goodsName):''
    des?goods.set('des', des):''
    type?goods.set('type', type):''
    money?goods.set('money', parseFloat(money)):''
    const file = req.file;
    if (file) {
      // 读取文件内容
      const data = fs.readFileSync(file.path);

      // 创建 AV.File 对象
      const fileName = `product_${Date.now()}${path.extname(file.originalname)}`;
      const avFile = new AV.File(fileName, { base64: Buffer.from(data).toString('base64') });

      // 保存文件到云端
      const savedFile = await avFile.save();
       await goods.set('picnic', savedFile); // 保存文件对象引用
      fs.unlinkSync(file.path);
    }

    // 保存商品到数据库
    const result = await goods.save();

    // 返回成功结果
    res.status(201).json({
      id: result.id,
      ...result.toJSON(),
      message: '商品更新成功'
    });

  } catch (error) {
    console.error('更新商品失败:', error);
    res.status(500).json({ error: error.message });
  }
});



apiRouter.delete('/myEmail', async (req, res) => {
  try {
    const { id,email } = req.body;
    const item = AV.Object.createWithoutData('Publisher', id);
    await item.fetch().then(async (result) => {
      const currentMoney = item.get('email').filter((item)=>item!==email) || [];
      item.set('email',currentMoney);
      return item.save();
    })
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


apiRouter.post('/AddOrder', async (req, res) => {
  try {
    const { goodsId,buyerId,senderId,name,address } = req.body;
    const orderList = AV.Object.extend('Order');
    const order = new orderList();
    order.set('buyerId', buyerId);
    order.set('orderMaster',name)
    order.set('address',address)
    order.set('state',"待付款")
    const sender = AV.Object.createWithoutData('Publisher', senderId);
    await sender.fetch().then(async (result) => {
      order.set('headImg',result.get('headImg'));
      order.set('senderId',result.get('objectId'));
      order.set('sender',result.get('name'));
      order.set('sendAddress',result.get('address'));
    })
    const goods = AV.Object.createWithoutData('AllGoods',goodsId);
    await goods.fetch().then(async (result) => {
      order.set('picnic',result.get('picnic'));
      order.set('money',parseFloat(result.get('money')));
      order.set('goodsName',result.get('goods'));
    })
    await order.save()

    res.status(200).json({ id:order.get('objectId') })
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


apiRouter.put('/myAddress', async (req, res) => {
  try {
    const { address,id } = req.body;
    const item = AV.Object.createWithoutData('Publisher', id);
    item.set('address',address);
    await item.save();
    res.json({
      id: item.id,
      ...item.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


apiRouter.put('/myFavor', async (req, res) => {
  try {
    const { name,id } = req.body;
    const item = AV.Object.createWithoutData('Publisher', id);

    await item.fetch().then(async (result) => {
      let demo=item.get('favo')
      const currentMoney = demo.includes(name)?demo.filter((item)=>item!==name):[...demo,name];
      item.set('favo',currentMoney);
      return item.save();
    })
    res.json({
      id: item.id,
      ...item.toJSON()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.use('/apiSecond', apiRouter);


// cosRouter.get('/files', (req, res) => {
//   const prefix = req.query.prefix || '';
//
//   cos.getBucket({
//     Bucket,
//     Region,
//     Prefix: prefix
//   }, (err, data) => {
//     if (err) {
//       return res.status(500).json({ error: err.message });
//     }
//     res.json(data.Contents);
//   });
// });
// app.use('/apiSecondTx', cosRouter);

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
