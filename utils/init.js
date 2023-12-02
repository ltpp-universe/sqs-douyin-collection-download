/*
 * @Author: wmzn-ltpp 1491579574@qq.com
 * @Date: 2023-11-09 21:32:28
 * @LastEditors: wmzn-ltpp 1491579574@qq.com
 * @LastEditTime: 2023-11-12 18:53:44
 * @FilePath: \sqs-douyin-collection-download\utils\init.js
 * @Description: Email:1491579574@qq.com
 * QQ:1491579574
 * Copyright (c) 2023 by SQS, All Rights Reserved. 
 */
const fs = require('fs');
const path = require('path');
const Console = require('sqs-console');
const { sleep, show_error_exit_msg_time, app_path, app_config_path } = require('./base');
const config_path = app_path + app_config_path;

/**
 * 生成配置
 */
const creatConfig = async function () {
    try {
        if (fs.existsSync(config_path)) {
            return Promise.resolve();
        }
        const config_str = '{"db_host":"127.0.0.1","db_username":"","db_password":"","db_port":3366,"db_database":"","cookie":"","save_sql_path":"/video.db","save_progress_path":"/progress","save_path":"/video/","save_cursor_list_path":"/cursor_list","download":true,"updatedatabase":false,"update_list_length_limit":1000,"max_no_update_time_to_delete":30}';
        fs.mkdirSync(path.dirname(config_path), { recursive: true });
        fs.writeFileSync(config_path, config_str);
        Console.log(0, `请填写配置文件（${config_path}）的必备字段后重新运行`);
    } catch (error) {
        Console.log(0, `生成配置文件（${config_path}）出错:${error}`);
    }
    await sleep(show_error_exit_msg_time);
    process.exit(1);
}

/**
 * 读取配置 
 * @returns {Object} res
 */
const readConfig = async function () {
    try {
        await creatConfig();
        if (!fs.existsSync(config_path)) {
            Console.log(0, '配置文件不存在');
            process.exit(1);
        }
        const config_str = fs.readFileSync(config_path);
        const config_json = JSON.parse(config_str);
        return config_json;
    } catch (error) {
        Console.log(0, `读取配置文件出错:${error}`);
        process.exit(1);
    }
}


module.exports = {
    readConfig
}