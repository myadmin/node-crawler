const fs = require('fs')
const https = require('https')
const axios = require('axios')
const cheerio = require('cheerio')
const download = require('download')
const { DownloaderHelper } = require('node-downloader-helper')

const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_1_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36',
}

const sleep = (time) => new Promise((reslove) => setTimeout(reslove, time));

const load = async (skip = 0) => {
    const data = await axios
        .get(
            'http://service.picasso.adesk.com/v1/vertical/category/4e4d610cdf714d2966000000/vertical',
            {
                headers,
                params: {
                    limit: 30, // 每页固定返回30条
                    skip: skip,
                    first: 0,
                    order: 'hot',
                },
            }
        )
        .then((res) => {
            return res.data.res.vertical
        })
        .catch((err) => {
            console.log(err)
        });
    await downloadFile2(data)
    await sleep(3000)
    if (skip < 1000) {
        load(skip + 30)
    } else {
        console.log('下载完成')
    }
}

const getImgerUrl = async (targetUrl, containerEelment) => {
    const resultList = [];
    const res = await axios.get(targetUrl);
    const html = res.data;
    const $ = cheerio.load(html);
    $(containerEelment).each((ele) => {
        resultList.push($(ele).find('img').attr('src'));
    });
    return resultList;
}

const download2 = (url) => {
    https.get(url, (res) => {
        const path = `${__dirname}/files/img.jpeg`;
        const filePath = fs.createWriteStream(path);
        res.pipe(filePath);
        filePath.on('finish', () => {
            filePath.close();
            console.log('Download Completed');
        });
    });
}

const downloadFile = (file) => {
    const filePath = `${__dirname}/files`;

    const dl = new DownloaderHelper(file, filePath);

    dl.on('end', () => console.log('Download Completed'));

    dl.start();
}

const downloadImg = (imgUrl) => {
    const filePath = `${__dirname}/files`;

    download(imgUrl, filePath).then(() => {
        console.log('Download Completed');
    });
}

const downloadFile2 = async (data) => {
    for (let index = 0; index < data.length; index++) {
        const item = data[index];

        const filePath = `${__dirname}/美女`;

        await download(item.wp, filePath, {
            filename: item.id + '.jpeg',
            headers,
        }).then(() => {
            console.log(`Download ${item.id} Completed`);
            return;
        });
    }
}

load();

const categoryUrl = `https://service.picasso.adesk.com/v1/vertical/category`;
const writeData = async () => {
    const { data } = await axios.get('https://service.picasso.adesk.com/v1/vertical/category');
    console.log('data', data.code);
    const result = [];
    if (data.code === 0) {
        data.res.category.forEach(item => {
            result.push({
                title: item.name,
                id: item.id,
                category: `${categoryUrl}/${item.id}/vertical`
            });
        });
        console.log('result', result);
        fs.writeFileSync(`${__dirname}/data.json`, JSON.stringify(result), 'utf-8');
    }
}

// writeData();

/**
推荐: http://service.picasso.adesk.com/v3/homepage/vertical
分类: https://service.picasso.adesk.com/v1/vertical/category
分类-最新-热门 https://service.picasso.adesk.com/v1/vertical/category/${id}/vertical
专辑 https://service.picasso.adesk.com/v1/wallpaper/album
专辑-详情 https://service.picasso.adesk.com/v1/wallpaper/album/${id}/wallpaper
图片评论 https://service.picasso.adesk.com/v2/wallpaper/wallpaper/${id}/comment
 */


/**
 * 推荐: http://service.picasso.adesk.com/v3/homepage/vertical
 * @param {limit} number 获取多少条数据
 * @param {order} string 关键字 “hot”
 * @param {skip}  number 跳过多少条
 */