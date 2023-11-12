<!--
 * @Author: wmzn-ltpp 1491579574@qq.com
 * @Date: 2023-11-10 09:34:18
 * @LastEditors: wmzn-ltpp 1491579574@qq.com
 * @LastEditTime: 2023-11-10 12:06:19
 * @FilePath: \sqs-douyin-collection-download\readme.md
 * @Description: Email:1491579574@qq.com
 * QQ:1491579574
 * Copyright (c) 2023 by SQS, All Rights Reserved. 
-->
# 抖音收藏视频批量爬取

> 抖音收藏视频批量爬取工具，支持win(64-bit),linux(64-bit),mac(64-bit)

## 开箱即用

- win:双击sqs-douyin-collection-download.exe运行
- linux:输入chmod 555 ./sqs-douyin-collection-download;./sqs-douyin-collection-download.exe;回车运行

## 使用说明

- 如果需要打包请先解压node.7z到当前目录，然后依次运行
    - cnpm i
    - cnpm run install-pkg
    - linux系统运行cnpm run pkg-linux
    - windows系统运行cnpm run pkg-win
    - macos系统运行cnpm run pkg-mac

    打包后会生成可执行文件在项目根目录

- 运行前需要填写config.json配置文件里的cookie

- config.json配置文件详情

| 配置key |  配置value  | 是否必选 | 默认值 |
|---------|---------|---------|---------|
| db_host | 数据库地址 | 否 | 127.0.0.1 |
| db_username | 数据库用户名 | 否 | |
| db_password | 数据库密码 | 否 | |
| db_port | 数据库端口 | 否 | |
| db_database | 数据库名称 | 否 | |
| cookie | 抖音cookie | 是 | |
| save_sql_path | 保存的SQL文件路径 | 否 | ./video.db |
| save_progress_path | 进度缓存文件路径 | 是 | ./progress |
| save_path | 视频保存文件夹路径 | 是 | ./抖音下载/ |
| save_cursor_list_path | 已缓存列表文件路径 | 是 | ./cursor_list |
| download | 是否下载视频 | 否 | true |
| updatedatabase | 是否保存数据库 | 否 | false |
| update_list_length_limit | 爬取视频最大个数 | 否 | 1000 |
| max_no_update_time_to_delete | 数据库time字段超过该时间删除记录（单位：分钟） | 否 | 30 |

> PS:如果updatedatabase设置成true，请填写db_host，db_username，db_password，db_port，db_database