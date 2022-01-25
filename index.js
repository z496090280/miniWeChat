/*
 * @Author: lee
 * @Date: 2022-01-25 10:14:55
 * @LastEditTime: 2022-01-25 10:43:40
 */
// 二维码库
import drawQrcode from "weapp-qrcode"

Page({
    data: {
        // 屏幕宽
        screenWidth: 0,
        // canvas画布
        width: 0,
        height: 0,
        // 保存到本地分享按钮 && 阻止屏幕滚动
        showShare: false,
        canvas: null,
        options: [
            { name: '下载本地', icon: '/images/download.png', },
        ],
        imagesList: [
            'https://eabbc-prod.oss-cn-beijing.aliyuncs.com/images/ytcminapp/shareFriend/if1.png',
            'https://eabbc-prod.oss-cn-beijing.aliyuncs.com/images/ytcminapp/shareFriend/if2.png',
            'https://eabbc-prod.oss-cn-beijing.aliyuncs.com/images/ytcminapp/shareFriend/if3.png',
            'https://eabbc-prod.oss-cn-beijing.aliyuncs.com/images/ytcminapp/shareFriend/if4.png',
            'https://eabbc-prod.oss-cn-beijing.aliyuncs.com/images/ytcminapp/shareFriend/if5.png',
        ],
        // 轮播图索引
        xindex: 0,
        // 分享信息参数
        userInfo: {
            inviteCode: ''
        },
        // 分享二维码
        poster_qrcode: '',
        // canvas可见与否
        showCanvas: ''
    },

    /**
     * @description: 
     * @param {*}
     * @return {*}
     */
    onLoad: function (options) {
        let _this = this
        wx.getSystemInfo({
            success(res) {
                _this.setData({
                    width: 180 * res.pixelRatio,
                    height: 250 * res.pixelRatio,
                    screenWidth: res.screenWidth
                })
            }
        })

        this.initPage()
    },
    /**
     * @description: 初始化函数集
     * @param {*}
     * @return {*}
     */
    initPage: function () {
        this.initData()
    },
    /**
     * @description: 这里获取二维码等页面信息
     * @param {*}
     * @return {*}
     */
    initData: async function () {
        await getPromoterInfo().then(res => {
            this.setData({
                userInfo: res.data,
            })
        })

        this.initQrcode()
    },
    /**
     * @description: 二维码生成
     * @param {*}
     * @return {*}
     */
    initQrcode: function () {
        let _this = this
        let sourceType = wx.getStorageSync('storage_user_info').sourceType
        // 编辑你的二维码地址
        let url = `${DOMAIN}` + '/introduce?from=invite&partnerInviteCode=' + this.data.userInfo.inviteCode + '&sourceType=' + sourceType;
        drawQrcode({
            width: 200,
            height: 200,
            canvasId: 'myQrcode',
            text: url
        })
        wx.canvasToTempFilePath({
            canvasId: "myQrcode",
            success: (res) => {
                _this.setData({
                    poster_qrcode: res.tempFilePath
                })
            },
            fail: function (err) {
                console.log(err);
            },
        })
    },
    /**
     * @description: 显示保存本地按钮，且开始绘制
     * @param {*} event
     * @return {*}
     */
    invite(event) {
        this.setData({
            showShare: true,
            showCanvas: true
        });
        wx.showToast({
            title: '绘制中……',
            icon: 'loading',
            duration: 3000
        })
        // 触发绘制海报
        this.handleCanvas()
    },
    /**
     * @description: 绘制canvas函数
     * @param {*}
     * @return {*}
     */
    handleCanvas: function () {
        let _this = this
        const query = wx.createSelectorQuery()
        // 这个画布必须显示，否则报错！！！！
        query.select('#canvasPoster')
            .fields({ node: true, size: true })
            .exec((res) => {
                const canvas = res[0].node
                this.setData({ canvas })
                const ctx = canvas.getContext('2d')
                // 获取各个设备的相对单位基数
                const dpr = wx.getSystemInfoSync().pixelRatio
                canvas.width = res[0].width * dpr
                canvas.height = res[0].height * dpr
                ctx.scale(dpr, dpr)

                let ImgCvs = canvas.createImage()
                ImgCvs.src = _this.data.imagesList[_this.data.xindex]
                // onload 可以加载网络图片，需要配合Canvas.createImage()
                ImgCvs.onload = async function () {
                    // 背景图填充
                    await ctx.drawImage(ImgCvs, 0, 0, _this.data.width, _this.data.height);
                    // 画矩阵
                    // ctx.fillStyle = '#DE2F0B'
                    // ctx.fillRect(25, _this.data.height - 100, _this.data.width - 40, 80);
                    // 文案
                    ctx.font = 'normal 18px 幼圆'
                    ctx.fillStyle = '#fff'
                    ctx.fillText('长按图片识别二维码', 65 * dpr, _this.data.height - 35 * dpr)
                    ctx.font = 'normal 14px 幼圆'
                    ctx.fillText('立即加入', 65 * dpr, _this.data.height - 20 * dpr)
                    // ctx.draw = true
                }

                setTimeout(() => {
                    // 二维码填充
                    let qrCode = canvas.createImage()
                    // qrCode.src = '../../../images/shareFriend/qr.png'
                    qrCode.src = _this.data.poster_qrcode
                    qrCode.onload = async function () {
                        await ctx.drawImage(qrCode, 20 * dpr, _this.data.height - 50 * dpr, 35 * dpr, 35 * dpr);
                    }

                    drawing = false
                    // _this.getTempFilePath();
                }, 1000)
            })
    },
    onSelect(event) {
        if (event.detail.index == 0) {
            this.savePoster()
        }

        this.onClose();
    },
    onClose() {
        this.setData({ showShare: false, showCanvas: false });
    },
    onChange: function (e) {
        this.setData({
            xindex: e.detail.current
        });
    },
    /**
     * @description: 点击保存本地函数
     * @param {*}
     * @return {*}
     */
    savePoster: function () {
        var that = this;
        wx.getSetting({
            success(res) {
                if (!res.authSetting['scope.writePhotosAlbum']) {
                    wx.authorize({
                        scope: 'scope.writePhotosAlbum',
                        success() { //这里是用户同意授权后的回调
                            that.getTempFilePath();
                        },
                        fail() { //这里是用户拒绝授权后的回调
                            wx.showModal({
                                title: '提示',
                                content: '若不打开授权，则无法将图片保存在相册中！',
                                showCancel: true,
                                cancelText: '去授权',
                                cancelColor: '#000000',
                                confirmText: '暂不授权',
                                confirmColor: '#3CC51F',
                                success: function (res) {
                                    if (res) {
                                        wx.openSetting({
                                            //调起客户端小程序设置界面，返回用户设置的操作结果。
                                        })
                                    } else {
                                        // console.log('用户点击取消')
                                    }
                                }
                            })
                        }
                    })
                } else { //用户已经授权过了 
                    that.getTempFilePath();
                }
            }
        })
    },
    /**
     * @description: 触发微信自带api
     * @param {*}
     * @return {*}
     */
    getTempFilePath: function () {
        let _this = this
        wx.canvasToTempFilePath({
            canvas: this.data.canvas,
            // destWidth: 1200,
            // destHeight: 600,
            success: (res) => {
                this.saveImageToPhotosAlbum(res.tempFilePath)
            }
        })
    },
    /**
     * @description: 触发微信自带api
     * @param {*} imgUrl
     * @return {*}
     */
    saveImageToPhotosAlbum: function (imgUrl) {
        let _this = this
        if (imgUrl) {
            wx.saveImageToPhotosAlbum({
                filePath: imgUrl,
                success: (res) => {
                    wx.showToast({
                        title: '保存成功',
                        icon: 'success',
                        duration: 2000
                    })
                    drawing = false
                    _this.setData({
                        showCanvas: false
                    })
                },
                fail: (err) => {
                    wx.showToast({
                        title: '保存失败',
                        icon: 'none',
                        duration: 2000
                    })
                    drawing = false
                    _this.setData({
                        showCanvas: false
                    })
                }
            })
        } else {
            wx.showToast({
                title: '绘制中……',
                icon: 'loading',
                duration: 3000
            })
        }
    },
})