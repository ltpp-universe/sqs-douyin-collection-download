/*
 * @Author: wmzn-ltpp 1491579574@qq.com
 * @Date: 2023-11-09 12:46:39
 * @LastEditors: wmzn-ltpp 1491579574@qq.com
 * @LastEditTime: 2023-11-12 17:48:36
 * @FilePath: \sqs-douyin-collection-download\main.js
 * @Description: Email:1491579574@qq.com
 * QQ:1491579574
 * Copyright (c) 2023 by SQS, All Rights Reserved. 
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const Console = require('sqs-console');
const { runSql } = require('./utils/db');
const { readConfig } = require('./utils/init');
const { getListcollection } = require('./utils/douyin');
const { sleep, show_error_exit_msg_time } = require('./utils/base');

let video_url_list = [];
let save_sql_up_finish = false;

let download;
let save_path;
let save_sql_path;
let updatedatabase;
let save_progress_path
let save_cursor_list_path;
let update_list_length_limit;
let max_no_update_time_to_delete;

const limit = 10;

/**
 * 创建不存在的文件夹
 * @param {String} dir_path 
 */
const creatDirNotExists = function (dir_path) {
    if (!fs.existsSync(dir_path)) {
        fs.mkdirSync(dir_path);
    }
}

/**
 * 重命名视频
 * @param {Number} aweme_id
 * @param {String} preview_title 
 * @returns 
 */
const renameVideoName = function (aweme_id, preview_title) {
    // 去除双引号
    preview_title = preview_title.replace(/\"/g, '-');
    // 转义单引号
    preview_title = preview_title.replace(/'/g, '\'\'');
    // 转义\
    preview_title = preview_title.replace(/\\/g, '-');
    // 转义/
    preview_title = preview_title.replace(/\//g, '-');
    // 去除特殊字符
    preview_title = preview_title.replace(/[^\w\u4e00-\u9fa5]/g, '');
    if (!preview_title) {
        preview_title = String(aweme_id).replace(/[:+\s]/g, '-');
    }
    return preview_title;
}

/**
 * 下载视频
 * @param {Number} aweme_id
 * @param {*} preview_title 
 * @param {*} video_url 
 * @returns
 */
const saveVideo = async function (aweme_id, preview_title, video_url) {
    preview_title = renameVideoName(aweme_id, preview_title);
    return new Promise((resolve) => {
        try {
            Console.log(0, `${preview_title}.mp4开始下载`, 'BgCyan');
            creatDirNotExists(save_path);
            const file = fs.createWriteStream(`${save_path}${preview_title}.mp4`);
            http.get(video_url, function (response) {
                const len = parseInt(response.headers['content-length'], 10);
                let cur = 0;
                const mp = new Map();
                response.on('data', function (chunk) {
                    cur += chunk.length;
                    const progress = (100.0 * cur / len).toFixed(2);
                    const trunc = Math.trunc(progress);
                    if (!mp.get(trunc) && trunc && !(trunc % 10)) {
                        process.stdout.clearLine();
                        process.stdout.cursorTo(0);
                        Console.log(0, `${preview_title}.mp4已下载[${progress}%]`, 'BgYellow');
                    }
                    if (!mp.get(trunc)) {
                        mp.set(trunc, true);
                    }
                });

                response.pipe(file);

                file.on("finish", async () => {
                    file.close();
                    mp.clear();
                    Console.log(0, `${preview_title}.mp4下载完成`);
                    resolve();
                });
            });
        } catch (error) {
            Console.log(0, `${preview_title}.mp4下载失败:${error}`, 'BgRed');
            resolve();
        }
    });
};

/**
 * 保存下载进度
 */
const saveProgress = function (data) {
    try {
        fs.mkdirSync(path.dirname(save_progress_path), { recursive: true });
        fs.writeFileSync(save_progress_path, data);
    } catch (error) {
    }
};

/**
 * 获取下载进度
 */
const readProgress = function () {
    let data = 0;
    try {
        data = fs.readFileSync(save_progress_path);
    } catch (error) {
    }
    return data;
};

/**
 * 添加URL
 * @param {Number} aweme_id
 * @param {String} name 
 * @param {String} url 
 */
const saveUrl = function (aweme_id, name, url) {
    if (video_url_list.length > update_list_length_limit) {
        return;
    }
    // 重命名name
    name = renameVideoName(aweme_id, name);
    aweme_id && url && (video_url_list.push({
        aweme_id,
        url,
        name
    }));
    Console.log(0, `${name}.mp4获取成功`);
    return;
};

/**
 * 保存cursor_list
 * @param {Array} cursor_list
 */
const saveCursorList = function (cursor_list) {
    try {
        const last_cursor_list = readCursorList();
        if (last_cursor_list.length >= cursor_list) {
            return;
        }
        const cursor_list_str = JSON.stringify(cursor_list);
        fs.mkdirSync(path.dirname(save_cursor_list_path), { recursive: true });
        fs.writeFileSync(save_cursor_list_path, cursor_list_str);
    } catch (err) {
        Console.log(0, `保存cursor_list出错:${err}`, 'BgRed');
    }
}

/**
 * 获取cursor_list
 * @returns {Array} cursor_list
 */
const readCursorList = function () {
    try {
        if (!fs.existsSync(save_cursor_list_path)) {
            fs.mkdirSync(path.dirname(save_cursor_list_path), { recursive: true });
            fs.writeFileSync(save_cursor_list_path, '[]');
            return [];
        }
        const cursor_list_str = fs.readFileSync(save_cursor_list_path);
        const cursor_list = JSON.parse(cursor_list_str);
        return cursor_list;
    } catch (err) {
        Console.log(0, `读取cursor_list出错:${err}`, 'BgRed');
    }
    return [];
}

/**
 * 保存到SQL文件
 * @returns
 */
const saveSql = async function () {
    return new Promise(async (resolve) => {
        try {
            const len = video_url_list.length;
            if (!len) {
                return resolve();
            }
            if (save_sql_up_finish) {
                return resolve();
            }
            save_sql_up_finish = true;
            let sql = `INSERT INTO video (url,name,tag) VALUES `;
            let add_cnt = 0;
            video_url_list.reverse();
            for (let i = 0; i < len; ++i) {
                const tem = video_url_list[i];
                // 查询name是否存在
                const query_has_child_sql = `EXISTS(SELECT 1 FROM video WHERE name = '${tem.name}' AND isdel = 0)`;
                const query_has_sql = `SELECT ${query_has_child_sql};`;
                const query_has_res = await runSql(query_has_sql);
                if (query_has_res?.length) {
                    let has = query_has_res[0][query_has_child_sql] == 1;
                    // name存在则更新url
                    if (has) {
                        const query_update_sql = `UPDATE video SET url = '${tem.url}', isdouyin = 1 WHERE name = '${tem.name}' AND isdel = 0;`;
                        await runSql(query_update_sql);
                        continue;
                    }
                }
                let tag = '';
                let name_len = tem.name.length;
                for (let j = 0; j < name_len; ++j) {
                    if (tem.name[j] == '#') {
                        let one_tag = '';
                        for (let z = j + 1; z < name_len; ++z) {
                            if (tem.name[z] == ' ') {
                                break;
                            }
                            one_tag += tem.name[z];
                            j = z;
                        }
                        tag += one_tag + ' ';
                    }
                }
                sql += `('${tem.url}','${tem.name}','${tag}'),`;
                ++add_cnt;
            }
            if (!add_cnt) {
                return resolve();
            }
            sql = sql.slice(0, sql.length - 1) +
                `;UPDATE video SET isdel = 1, time = NOW() WHERE isdouyin = 1 AND time < NOW() - INTERVAL ${max_no_update_time_to_delete} MINUTE;`;
            fs.mkdirSync(path.dirname(save_sql_path), { recursive: true });
            fs.writeFileSync(save_sql_path, sql);
            Console.log(0, `SQL文件保存在${save_sql_path}`);
            await runSql(sql);
        } catch (err) {
            Console.log(0, '保存SQL出错:' + err, 'BgRed');
        }
        return resolve();
    });
};

/**
 * 上传保存
 * @param {Array} cursor_list
 */
const upAndSaveSql = async function (cursor_list) {
    saveCursorList(cursor_list);
    save_sql_up_finish = false;
    await saveSql();
    video_url_list = [];
}

/**
 * 运行
 * @returns {Promise} res
 */
const run = async function () {
    let get_video_cnt = 0;
    const cursor_list = [];
    const last_cursor_list = readCursorList();
    const last_cursor_list_last = last_cursor_list.length ? last_cursor_list[last_cursor_list.length - 1] : 0;
    let has_match_last_cursor_list_last = false;
    return new Promise(async (resolve) => {
        try {
            video_url_list = [];
            save_sql_up_finish = false;
            let cursor = readProgress();
            if (updatedatabase) {
                cursor = 0;
            }
            let last_cursor = cursor;
            while (1) {
                cursor_list.push(cursor);
                if (cursor == last_cursor_list_last) {
                    has_match_last_cursor_list_last = true;
                }
                const res = await getListcollection(limit, cursor);
                if (!res?.aweme_list?.length) {
                    if (!cursor) {
                        Console.log(0, '请重新填写config.json中的cookie后重新运行');
                        await sleep(show_error_exit_msg_time);
                        process.exit(0);
                    }
                    await upAndSaveSql(cursor_list);
                    return resolve(true);
                }
                cursor = res.cursor_str;
                saveProgress(last_cursor);
                const aweme_list = res.aweme_list;
                const promise_list = aweme_list.map(async (tem) => {
                    const video_url = tem?.video?.bit_rate[0]?.play_addr?.url_list[0];
                    if (download && video_url && tem.aweme_id) {
                        await saveVideo(tem.aweme_id, tem.preview_title, video_url);
                        ++get_video_cnt;
                    }
                    if (updatedatabase && video_url && tem.aweme_id) {
                        saveUrl(tem.aweme_id, tem.preview_title, video_url);
                        ++get_video_cnt;
                    }
                });
                await Promise.all(promise_list);
                await upAndSaveSql(cursor_list);
                if (get_video_cnt > update_list_length_limit && has_match_last_cursor_list_last) {
                    return resolve(true);
                }
                last_cursor = cursor;
            }
        } catch (error) {
            Console.log(0, `下载失败:${error}`, 'BgRed');
        }
        Console.log(0, `抖音收藏爬取完成`);
        await upAndSaveSql(cursor_list);
        return resolve(true);
    });
};

(async () => {
    const config = await readConfig();
    download = config.download;
    save_path = path.resolve(process.cwd()) + config.save_path;
    save_sql_path = path.resolve(process.cwd()) + config.save_sql_path;
    updatedatabase = config.updatedatabase;
    save_progress_path = path.resolve(process.cwd()) + config.save_progress_path;
    save_cursor_list_path = path.resolve(process.cwd()) + config.save_cursor_list_path;
    update_list_length_limit = config.update_list_length_limit;
    max_no_update_time_to_delete = config.max_no_update_time_to_delete;

    if (updatedatabase) {
        let lock = false;
        while (1) {
            if (lock) {
                continue;
            }
            lock = true;
            run_res = await run();
            if (run_res) {
                lock = false;
            } else {
                lock = true;
            }
        };
    } else {
        await run();
    }
})();