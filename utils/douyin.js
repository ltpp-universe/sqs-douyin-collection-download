/*
 * @Author: ltpp-universe 1491579574@qq.com
 * @Date: 2023-11-09 14:17:44
 * @LastEditors: ltpp-universe 1491579574@qq.com
 * @LastEditTime: 2023-11-10 12:37:04
 * @FilePath: \sqs-douyin-collection-download\utils\douyin.js
 * @Description: Email:1491579574@qq.com
 * QQ:1491579574
 * Copyright (c) 2023 by SQS, All Rights Reserved. 
 */
const { listcollection_url, like_url } = require('./url');
const { readConfig } = require('./init');
const axios = require('axios');
let cookie = '';
const user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0';

/**
 * 获取收藏列表
 * @param {*} count 
 * @param {*} cursor 
 * @returns 
 */
const getListcollection = async function (count, cursor) {
    if (!cookie) {
        const config = await readConfig();
        cookie = config.cookie;
    }
    const { data: res } = await axios({
        method: 'post',
        url: listcollection_url,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: cookie,
            Referer: 'https://www.douyin.com/',
            'User-Agent': user_agent
        },
        data: { count, cursor },
    });
    return res;
}

/**
 * 获取喜欢列表
 * @param {*} aid 
 * @param {*} sec_uid 
 * @param {*} count 
 * @param {*} cursor 
 * @returns 
 */
const getLike = async function (aid, sec_uid, count, cursor) {
    const { data: res } = await axios({
        method: 'post',
        url: like_url,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: 'https://www.douyin.com/',
            'User-Agent': user_agent
        },
        data: {
            aid: aid,
            count: count,
            sec_uid: sec_uid,
            max_cursor: cursor,
        },
    });
    return res;
};

module.exports = {
    getListcollection,
    getLike
};