// 博客细节
var blogDetail = new Vue({
    el: '#blog-detail',
    data: {
        title: '',
        ctime: '',
        views: 0,
        content: ''
    },
    computed: {
        // 根据ID请求对应文章
        queryBlogById: () => {
            return () => {
                var params = location.search.substr(1).split('&'); // 获取地址栏参数
                var paramObj = {};
                for (const param of params) {
                    if (param == '') continue;
                    paramObj[param.split('=')[0]] = param.split('=')[1];
                }
                if (!paramObj['blog_id']) throw new Error('文章ID获取错误'); // 判断是否有blog_id属性
                axios.get('/queryBlogById?blog_id=' + paramObj['blog_id'])
                    .then(function (result) {
                        var data = result.data.data[0];
                        blogDetail.title = data.title;
                        blogDetail.ctime = new Date(data.ctime * 1000).toLocaleString().replace(/\//g, '-');
                        blogDetail.views = data.views;
                        // 代码片段添加对应类名
                        blogDetail.content = data.content;
                    })
                    .catch(function (error) {
                        throw new Error(error)
                    })
            }
        }
    },
    updated() {
        // Vue更新完成后执行DOM操作，判断是否有代码片段
        function code() {
            var $codepre = $("pre");
            if ($codepre.length > 0) {
                // 有代码片段给对应标签添加类名
                for (var i = 0; i < $codepre.length; i++) {
                    var item = $codepre.eq(i);
                    var language = "css";
                    var codehtml = item.html();
                    var code = $("<code>");
                    item.addClass('line-numbers');
                    code.attr("class", "language-" + language);
                    code.html(codehtml);
                    item.html(code);
                }
            }
            // 插入第三方插件高亮代码片段
            var script = document.createElement('script');
            script.src = './js/prism.js';
            document.body.appendChild(script);
        }
        code();
    },
    created() {
        this.queryBlogById(); // 根据文章ID请求对应数据
    }
})

// 留言模块
var detailMessage = new Vue({
    el: '#message',
    data: {
        page: 1,
        pageSize: 5,
        total: 0,
        messageList: []

    },
    computed: {
        // 查询当前文章ID的评论数据
        queryComments: () => {
            return (page = 1, pageSize = 5) => {
                var params = location.search.substr(1).split('&'); // 获取地址栏参数
                var paramObj = {};
                for (const param of params) {
                    if (param == '') continue;
                    paramObj[param.split('=')[0]] = param.split('=')[1];
                }
                if (!paramObj['blog_id']) throw new Error('文章ID获取错误'); // 判断是否有blog_id属性
                axios.get('/queryComments?blog_id=' + paramObj['blog_id'] + '&page=' + page + '&pageSize=' + pageSize)
                    .then(function (result) {
                        var data = result.data.data;
                        detailMessage.messageList = data.data;
                        detailMessage.total = data.total;
                    })
                    .catch(function (error) {
                        throw new Error(error)
                    })
            }
        },
        // 修改时间格式
        updateTime: () => {
            return (time) => {
                return new Date(time * 1000).toLocaleDateString().replace(/\//g, '-');
            }
        },
        // 点击回复设置detailComments.parent、parentName值
        replyComments: () => {
            return (id, name) => {
                detailComments.parent = id;
                detailComments.parentName = name;
            }
        },
        // 判断是否为回复评论
        isReply: () => {
            return (parent) => {
                return parent > 0 ? true : false;
            }
        },
        // 点击上一页触发
        prevClick: function () {
            return function (num) {
                detailMessage.page = detailMessage.page - 1;
                detailMessage.queryComments(detailMessage.page, detailMessage.pageSize);
            }
        },
        // 点击下一页触发
        nextClick: function () {
            return function (num) {
                detailMessage.page = detailMessage.page + 1;
                detailMessage.queryComments(detailMessage.page, detailMessage.pageSize);
            }
        },
        // 点击页数触发
        currentChange: function () {
            return function (num) {
                detailMessage.page = num;
                detailMessage.queryComments(detailMessage.page, detailMessage.pageSize);
            }
        }
    },
    created() {
        // 请求评论数据
        this.queryComments(this.page, this.pageSize);
    }
})

// 评论区域
var detailComments = new Vue({
    el: '#comments',
    data: {
        code: '',
        codeSvg: '',
        parent: -1,
        parentName: '0'
    },
    computed: {
        // 请求验证码
        getSvgCaptcha: () => {
            return () => {
                axios.get('/getSvgCaptcha')
                    .then(function (result) {
                        detailComments.code = result.data.data.text;
                        detailComments.codeSvg = result.data.data.data;
                    })
                    .catch(function (error) {
                        throw new Error(error)
                    })
            }
        },
        // 插入评论数据
        insertComments: () => {
            return (e) => {
                e.preventDefault(); // 阻止默认事件
                var codeText = document.getElementById('comments-code').value; // 得到验证码
                if (codeText.toLowerCase() != detailComments.code.toLowerCase()) {
                    alert('验证码不正确');
                    return
                };
                var params = location.search.substr(1).split('&');
                var paramObj = {};
                for (const param of params) {
                    paramObj[param.split('=')[0]] = param.split('=')[1];
                }
                if (!paramObj['blog_id']) throw new Error('文章ID获取错误');

                var name = document.getElementById('comments-name').value;
                var email = document.getElementById('comments-email').value;
                var comments = document.getElementById('comments-comments').value;
                if (!name || !email) return alert('name or email is null');

                // 发送请求
                axios.post('/insertComments', {
                        name,
                        email,
                        comments,
                        parent: detailComments.parent,
                        parentName: detailComments.parentName,
                        blogId: paramObj['blog_id']
                    })
                    .then(function (result) {
                        alert('提交成功')
                        document.getElementById('comments-form').reset(); // 清空文本框
                        detailComments.parent = -1; // 将父级值和名称重置
                        detailComments.parentName = '0'; // 将父级值和名称重置
                        detailMessage.queryComments(); // 重新获取留言数据
                        detailComments.getSvgCaptcha(); // 重新请求验证码
                        renderComments.queryNewComments(); // 重新拉取最新评论
                    })
                    .catch(function (error) {
                        throw new Error(error)
                    })
            }
        }
    },
    created() {
        this.getSvgCaptcha(); // 请求验证码
    }
})