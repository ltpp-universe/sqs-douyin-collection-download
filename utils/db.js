/*
 * @Author: wmzn-ltpp 1491579574@qq.com
 * @Date: 2023-11-09 21:16:22
 * @LastEditors: wmzn-ltpp 1491579574@qq.com
 * @LastEditTime: 2023-11-10 00:25:25
 * @FilePath: \node\utils\db.js
 * @Description: Email:1491579574@qq.com
 * QQ:1491579574
 * Copyright (c) 2023 by SQS, All Rights Reserved. 
 */
const mysql = require("mysql")
const Console = require('sqs-console');
const { readConfig } = require('./init');
let connection = null;

const init = async function () {
    return new Promise(async (resolve) => {
        const { db_host, db_username, db_password, db_port, db_database } = await readConfig();
        Console.log(0, '开始连接数据库');
        connection = mysql.createConnection({
            host: db_host,
            user: db_username,
            password: db_password,
            port: db_port,
            database: db_database,
            debug: false,
            multipleStatements: true,
            charset: 'UTF8MB4_UNICODE_CI'
        });
        connection.connect();
        connection.on('error', (err) => {
            if (err) {
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    init();
                }
            }
        });
        Console.log(0, '数据库连接成功');
        resolve();
    });
};

const disconnectDb = function () {
    connection.end();
    Console.log(0, '数据库断开连接成功');
};

/**
 * 运行SQL
 * @param {String} sql
 */
const runSql = function (sql) {
    try {
        return new Promise(async (resolve) => {
            if (!connection) {
                await init();
            }
            connection.query(sql, (err, result) => {
                if (err) {
                    Console.log(0, `SQL执行错误:${err}`, 'BgRed');
                }
                resolve(result);
            });
        });
    } catch (err) {
        Console.log(0, `数据库错误:${err}`, 'BgRed');
        process.exit(1);
    }
};

module.exports = {
    runSql
};