require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();


//app.use(express.json());
app.use(express.urlencoded());
// Basic Configuration
const port = process.env.PORT || 3000;
app.use(cors());


const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://oguzhan:02541768@cluster0.ik5jmgh.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });


let urlSchema = new mongoose.Schema({
  orginal_url: { type: String, required: true },
  short_url: { type: Number }
});

let orginalShortUrl = mongoose.model('orginalShortUrl', urlSchema);

async function saveUrl(orginal_url) {
  let answer;
  await orginalShortUrl.find({}).sort({ short_url: -1 }).limit(1).exec().then((data)=>{
      answer=data[0].short_url+1;
    
  }).catch((err)=>console.log(err))
  
  let url = new orginalShortUrl({
    orginal_url: orginal_url,
    short_url: answer
  })
  url.save().then((data) => {
    console.log(data)
  }).catch((err) => {
    console.log(err)
  })
  return answer;
}

async function isExistUrl(orginal_url_newOne) {
  let result;
  await orginalShortUrl.find({ orginal_url: orginal_url_newOne }).then((data) => {
    result = data[0].short_url;
  }).catch((err) => {
    console.log(err)
    result = 0;
  })
  if (result != 0) {
    return result;
  }
  else return 0;
}

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', async function(req, res) {

  try {
    let url = new URL(req.body.url)
    if (url.protocol != "http:" && url.protocol != "https:") {
      throw new Error("Invalid URL")
    }
    
    let short_url_start = await isExistUrl(url.href)

    if (short_url_start != 0) {
      console.log("exist")
    }
    else {
      short_url_start = await saveUrl(url.href)
    }

    res.send({
      orginal_url: url.href,
      short_url: short_url_start
    })


  }
  catch (e) {
    res.send({ error: 'Invalid URL' })
  }
})


app.get('/api/shorturl/:short_url', async function(req, res) {
  let short_url = req.params.short_url
  let orginal_url;
  await orginalShortUrl.find({ short_url: short_url }).then((data) => {
    orginal_url = data[0].orginal_url;
  }).catch((err) => {
    console.log(err)
    orginal_url = 0;
  })
  if (orginal_url != 0) {
    res.redirect(orginal_url)
  }
  else res.send({ error: "No short URL found for the given input" })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

