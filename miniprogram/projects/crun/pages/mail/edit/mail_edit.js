const pageHelper = require('../../../../../helper/page_helper.js');
const cloudHelper = require('../../../../../helper/cloud_helper.js');
const dataHelper = require('../../../../../helper/data_helper.js');
const MailBiz = require('../../../biz/mail_biz.js');
const validate = require('../../../../../helper/validate.js');
const ProjectBiz = require('../../../biz/project_biz.js');
const PassportBiz = require('../../../../../comm/biz/passport_biz.js');

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		isLoad: false
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: async function (options) {
		ProjectBiz.initPage(this);

		if (!await PassportBiz.loginMustBackWin(this)) return;

		if (!pageHelper.getOptions(this, options)) return;

		this._loadDetail();
	},

	_loadDetail: async function () {

		let id = this.data.id;
		if (!id) return;

		if (!this.data.isLoad) this.setData(MailBiz.initFormData(id)); // 初始化表单数据

		let params = {
			id
		};
		let opt = {
			title: 'bar'
		};
		let mail = await cloudHelper.callCloudData('mail/detail', params, opt);
		if (!mail) {
			this.setData({
				isLoad: null
			})
			return;
		};


		this.setData({
			isLoad: true,

			formCateId: mail.MAIL_CATE_ID,
			formOrder: mail.MAIL_ORDER,
			formEnd: mail.MAIL_END_TIME,

			formForms: mail.MAIL_FORMS,

		});

	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () { },

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () { },

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () { },

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () { },

	/**
	* 页面相关事件处理函数--监听用户下拉动作
	*/
	onPullDownRefresh: async function () {
		await this._loadDetail();
		this.selectComponent("#cmpt-form").reload();
		wx.stopPullDownRefresh();
	},

	url: function (e) {
		pageHelper.url(e, this);
	},


	bindFormSubmit: async function () {
		if (!await PassportBiz.loginMustCancelWin(this)) return;

		let data = this.data;
		data = validate.check(data, MailBiz.CHECK_FORM, this);
		if (!data) return;

		let forms = this.selectComponent("#cmpt-form").getForms(true);
		if (!forms) return;
		data.forms = forms;

		data.cateName = MailBiz.getCateName(data.cateId);

		try {

			let id = this.data.id;
			data.id = id;

			// 创建
			await cloudHelper.callCloudSumbit('mail/edit', data).then(async res => {
				// 图片
				await cloudHelper.transFormsTempPics(forms, 'mail/', id, 'mail/update_forms');

				let cb = () => {
					// 更新列表页面数据
					let node = {
						'status': res.data.statusDesc,
						'MAIL_CATE_ID': data.cateId,
						'end': data.end,
						'MAIL_OBJ': {
							'title': dataHelper.getDataByKey(data.forms, 'mark', 'title').val,
							'price': dataHelper.getDataByKey(data.forms, 'mark', 'price').val,
							'poster': dataHelper.getDataByKey(data.forms, 'mark', 'poster').val,
							'address1': dataHelper.getDataByKey(data.forms, 'mark', 'address1').val,
							'address2': dataHelper.getDataByKey(data.forms, 'mark', 'address2').val,
						}
					}
					pageHelper.modifyPrevPageListNodeObject(id, node);

					wx.navigateBack();

				}
				pageHelper.showSuccToast('修改成功', 2000, cb);
			});



		} catch (err) {
			console.log(err);
		}
	},


})