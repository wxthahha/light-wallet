/**
 * fetch 封装；
 * */

import {toastShort} from "./ToastUtil"
// import {fetch} from 'whatwg-fetch'

function setUriParam(keys, value, keyPostfix) {
    let keyStr = keys[0];

    keys.slice(1).forEach((key) => {
        keyStr += `[${key}]`;
    });

    if (keyPostfix) {
        keyStr += keyPostfix;
    }

    return `${encodeURIComponent(keyStr)}=${encodeURIComponent(value)}`;
}


function getUriParam(keys, object) {
    const array = [];
    //参数的值是数组
    if (object instanceof (Array)) {
        object.forEach((value, index) => {
            array.push(setUriParam(keys, value, `[${index}]`));
        });
        //参数的值是对象；
    } else if (object instanceof (Object)) {
        for (const key in object) {
            if (object.hasOwnProperty(key)) {
                const value = object[key];
                //递归处理提交的参数类型以达到对应的格式；
                array.push(getUriParam(keys.concat(key), value));
            }
        }
    } else {
        //参数不为空；
        if (object !== undefined) {
            array.push(setUriParam(keys, object));
        }
    }

    return array.join('&');
}

function toQueryString(object) {
    const array = [];

    for (const key in object) {
        if (object.hasOwnProperty(key)) {
            const str = getUriParam([key], object[key]);

            if (str !== '') {
                array.push(str);
            }
        }
    }
    //得到最终的query形式的参数结构；
    return array.join('&');
}

function check404(res) {
    if (res.status && res.status === 404) {
        toastShort("当前页面资源不存在");
        return Promise.reject(res.status);
    }
    return res;
}

function check500(res) {
    if (res.status && res.status === 500) {
        toastShort("服务器异常错误");
        return Promise.reject(res.status);
    }
    return res;
}

function check200(res) {
    return res.json().then(function (data) {
        // console.log('请求的初始数据+++++',data,res);
        if (res.status && res.status >= 200 && res.status < 300) {
                // if (data.msg) {
                //     toastShort(data.msg);
                // }
                // console.log("http请求返回数据：", data);
                return data;
        } else {
            if (data.error) {
                toastShort(data.error);
                console.log("请求报错：", data.error)
            }
            return Promise.reject(data);
        }
    })
}


export async function xFetch(url, options) {
    let mergeUrl = url;
    //默认的options
    const defaultOptions = {
        method: 'GET',
        mode: 'cors',
        credentials: 'include'
    };

    if (typeof(mergeUrl) == "object") {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                resolve(mergeUrl)
            });
        });
    }
    //合并默认以及输入的options;
    const opts = Object.assign({}, defaultOptions, {...options});
    //单独处理get请求
    if (opts && opts.method == "GET" && opts['params']) {
        mergeUrl = mergeUrl + '?' + toQueryString(opts['params']);
    }

    opts.headers = {
        ...opts.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };

    if (opts.body) {
        opts.body = JSON.stringify(opts.body)
    }
    console.log("检查url-------", mergeUrl);
    console.log("查看opts参数（body）--------", opts);

    return Promise.race([fetch(mergeUrl, opts),
        new Promise(function (resolve, reject) {
            setTimeout(() => reject(new Error('request timeout')), 10 * 1000)
        }) // 超时处理
    ])
        .then((res) => check404(res))
        .then(check500)
        .then(check200)
        .catch((error) => {
            //如果超时 这里面的错误就是 request timeout
            console.log("fetch error :", error, url)
            if (error == "Error: request timeout") {
                toastShort("请求超时")
            } else if (error == "TypeError: Network request failed") {
                toastShort("请求失败")
            } else if (error === 401 || error === 433) {

            } else if (error === 401 || error === 434) {

            } else if (!error["status"]) {
                toastShort("服务器异常错误")
            }
            if (error) {
            }
            return Promise.reject(error);
        });
}
