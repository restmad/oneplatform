layui.define(['layer', 'laytpl', 'form', 'element', 'util'], function(exports){
  var $ = layui.jquery
  ,layer = layui.layer
  ,laytpl = layui.laytpl
  ,form = layui.form
  ,element = layui.element
  ,util = layui.util
  ,device = layui.device()
  ,DISABLED = 'layui-btn-disabled';
  
  //阻止IE7以下访问
  if(device.ie && device.ie < 8){
    layer.alert('不支持该浏览器');
  }
  
  layui.focusInsert = function(obj, str){
    var result, val = obj.value;
    obj.focus();
    if(document.selection){ //ie
      result = document.selection.createRange(); 
      document.selection.empty(); 
      result.text = str; 
    } else {
      result = [val.substring(0, obj.selectionStart), str, val.substr(obj.selectionEnd)];
      obj.focus();
      obj.value = result.join('');
    }
  };


  //数字前置补零
  layui.laytpl.digit = function(num, length, end){
    var str = '';
    num = String(num);
    length = length || 2;
    for(var i = num.length; i < length; i++){
      str += '0';
    }
    return num < Math.pow(10, length) ? str + (num|0) : num;
  };
  
//  $.ajaxSetup({ 
//	  contentType: "application/json",
//      dataType: "json"
//  });
  
  var oneplatform = {
		    //Ajax
		    post: function(url, data, success) {
		    	data = data || {};
		    	success = success || 'alert';
		        return $.ajax({
		        	dataType:"json",
				    type: "POST",
			        url: url,
			        contentType: "application/json",
		            data: JSON.stringify(data),
		            success: function(res) {
		                if (res.code === 200) {
		                	if(success === 'alert'){
		                		layer.msg(res.msg || '操作成功', {icon: 5});
		                	}else if(typeof(success) === 'function'){
		                		success(res.data);
		                	}
		                } else {
		                    layer.msg(res.msg || res.code, {shift: 6});
		                }
		            },
		            error: function(e) {
		                layer.msg('请求异常，请重试', {shift: 6});
		            }
		        });
		    },
		    success: function(msg) {
				layer.msg(msg || '操作成功', {icon: 5});
				return;
			},
			error: function(msg) {
				layer.msg(msg, {shift: 6});
			},
			iframeDialog(title,url){
				var index = layer.open({
					  type: 2,
					  title: title,
					  shadeClose: true,
					  shade: 0.8,
					  area: ['893px', '600px'],
					  maxmin: false,
					  content: [url, 'no']
					}); 
				layer.full(index);
			},
			
			dataRender: function($container,data){
				$('[bindAttr]',$container).each(function(){
					var self = $(this),bindAttr = self.attr('bindAttr');
					var value;
					if(bindAttr.indexOf('{')==0){
						var attrs = bindAttr.substring(1,bindAttr.length - 1).split(',');
						var jsonObj = {};
						for(var i in attrs){
							jsonObj[attrs[i]] = eval('data.'+attrs[i]);
						}
						self.attr('data',JSON.stringify( jsonObj ));
					}else if(bindAttr.indexOf('template:')==0){
						var templateId = bindAttr.replace(/template:/, '');
						var html = template(templateId, data);
						self.html(html);
					}else{
						try{value = eval('data.'+bindAttr);}catch(e){}
						if(!value)return;
						if(self.is('input')){
							var type = self.attr('type');
							if(type == 'radio'){
								if(self.attr('value') == value+"")self.attr('checked',true);
							}else if(type == 'checkbox'){
								if(self.attr('value') == value+"")self.attr('checked',true);
								var switchElm;
								if(switchElm = self.next('.layui-form-switch')){
									switchElm.addClass('layui-form-onswitch');
								}
							}else{
								self.val(value);
						    }
						}else if(self.is('textArea')){
							self.val(value);
						}else if(self.is('img')){
							self.attr('src',APP.attachRoot + value);
						}else if(self.is('a')){
							self.attr('href',value);
						}else if(self.is('select')){
							self.find("option[value='"+value+"']").attr("selected",true);  
						}else{
							self.html(value);
						}
					}
					//self.removeAttr('bindAttr');
				});
			},
			getQueryParams:function(name){
				var search = location.search;
				if(!search || search.lengh <=1)return null;
              if(name){
              	var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
 			        var r = search.substr(1).match(reg);
 			        if(r!=null)return  unescape(r[2]); return null;
              }else{
              	var params = {};
              	var arrs = search.substr(1).split('&');
			    	arrs.forEach(function(item){
			    		var arrs2  = item.split('=');
			    		if(arrs2.length == 2 && arrs2[1]){
			    			params[arrs2[0]] = arrs2[1];
			    		}
			    	});
			    	return params;
              }
			},
			serializeJson($form){
				var params = {};
				var dataArrays = $form.serializeArray();
				if(dataArrays){
					$.each( dataArrays, function(i, field){
						if(field.value && field.value != ''){	
							var isCheckbox = $("input[name='"+field.name+"']",$form).is(':checkbox');
							if(params[field.name]){
								params[field.name].push(field.value);
							}else{
								if(isCheckbox){
									params[field.name] = new Array();
									params[field.name].push(field.value);
								}else{
									params[field.name] = field.value;
								}
							}
						}
					});
				}
				return params;
			},
			redirct:function(url){
				url = url || location.href;
				url = url.replace("?__rnd=","__rnd=").replace("&__rnd=","__rnd=").split("__rnd=")[0];
				var rnd = (url.indexOf("?")>0 ? "&" : "?") + "__rnd=" + new Date().getTime();
				window.location.href = url + rnd;
			}
};

exports('oneplatform', oneplatform);

//template
 $('*[dataLoad]').each(function(){
		var $this = $(this),url = $this.attr('dataLoad'),
		    renderTemplate = $this.attr('template-id'),
		    method=$this.attr('ajax-method') || 'GET',
		    callback = $this.attr('onFinishCallback'),
		    templateExtends=$this.attr('template-ext');	
		if(!url || url == ''){oneplatform.error('dataLoadURL不能为空');return;}
		var dataParams = oneplatform.getQueryParams();
		
		for(var name in dataParams){
			var replace = '{' + name + '}';
			url = url.replace(replace,dataParams[name]);
		}
		
		var _global = {};//全局拓展只需要加载一次
		var extendsCallback = {};
		//
		renderPage();
		
		function renderPage(params){
			params = params || {};
			if($this.parent().is('form')){
				var query = $this.parent().serializeArray();
				if(query){
					$.each( query, function(i, field){
						params[field.name] = field.value;
					});
				}
			}
			var loading = layer.load();
			var postdata = (params.length && params.length > 0) ? JSON.stringify(params) : (method == 'GET' ? '' : '{}');
			$.ajax({
				dataType:"json",
			    type: method,
		        url: url,
		        contentType: "application/json",
		        data:postdata,
				complete: function(){layer.close(loading);},
				success: function(result){
					if(result.code && result.code==401){top.location.href = "/login.html";return;}
					if(!result.code || result.code == 200){
						var renderData = result.data ? result.data : result;
						if(renderData == null || renderData.length == 0){
							return;
						}
						if(renderTemplate && renderTemplate != ''){
							var tpl = $('#'+renderTemplate).html();
							laytpl(tpl).render(renderData, function(html){
								$this.html(html);
							});
						}else{
							oneplatform.dataRender($this,renderData);
						}
						//拓展执行
						for(var index in extendsCallback){
							if(!_global[index]){
								extendsCallback[index](renderData);
							}
						}
						//
						if(callback){
						    eval(callback+"(renderData)");
			             }
					}else{
						oneplatform.error("无数据或者加载错误");
					}
				},
				error: function(xhr, type){
					if(xhr.status == 401){top.location.href = "/login.html";return;}
					$this.html('系统错误');
				}
			});
		}
	});
	
  //submit
	$('body').on('click','.J_ajaxSubmit',function(){
		var $this = $(this),$form = $this.parent(),callback = $this.attr('onSuccessCallback'),jumpUrl = $this.attr('onSuccessJumpurl');
		while(!$form.is('form')){
			$form = $form.parent();
		}
//		//验证
//		if(!$form.doFormValidator()){
//		  return;
//		}
		var params = oneplatform.serializeJson($form);
		$this.attr('disabled',true);
		var loading = layer.load();
		var requestURI = $form.attr('action');
		$.ajax({
			dataType:"json",
		    type: "POST",
	        url: requestURI,
	        contentType: "application/json",
	        data:JSON.stringify(params) ,
			complete: function(){layer.close(loading);},
			success: function(data){
				if(data.code==401){top.location.href = "/login.html";return;}
		        if(data.code==200){
		        	 oneplatform.success(data.msg || '操作成功');
		             data = data.data;
		             if(callback != undefined){
					    eval(callback+"(data)");
		             } else if(jumpUrl){
		            	 setTimeout(function(){window.location.href = jumpUrl;},500);
					 }else{		
						 parent.window.location.reload();
					 }
		             setTimeout(function(){parent.layer.closeAll();},1000);
		          }else{
		        	 $this.removeAttr('disabled');
		        	 oneplatform.error(data.msg);
		          }
		        },
			error: function(xhr, type){
				$this.removeAttr('disabled');
				oneplatform.error('系统错误');
			}
		});
	});
	//
	$('body').on('click','.J_iframe_dialog', function(){
		var self = $(this),
	     url = self.attr('data-url'),
	     title = self.attr('data-title') || '弹窗';
		 var index = layer.open({
			  type: 2,
			  title: title,
			  shadeClose: true,
			  shade: 0.8,
			  area: ['893px', '600px'],
			  content: [url, 'no']
			}); 
		 layer.full(index);
	});
	
	//
	$('body').on('click','.J_form_dialog', function(){
		var self = $(this),
		     templdateurl = self.attr('data-templdate'),
		     dataurl = self.attr('data-url'),
		     dialogTitle = self.attr('data-title') || '表单',
		     onLoadFinished = self.attr('onLoadFinishedCallback');
		var addBoxIndex = -1;
		$.get(templdateurl, null, function(form) {
			addBoxIndex = layer.open({
				type: 1,
				title: dialogTitle,
				content: form,
				btn: ['提交', '取消'],
				shade: false,
				offset: ['100px', '30%'],
				area: ['600px', '400px'],
				zIndex: 99999,
				maxmin: true,
				yes: function(index) {
					//触发表单的提交事件
					$('form.layui-form').find('button[lay-filter=submitbtn]').click();
				},
				full: function(elem) {
					var win = window.top === window.self ? window : parent.window;
					$(win).on('resize', function() {
						var $this = $(this);
						elem.width($this.width()).height($this.height()).css({
							top: 0,
							left: 0
						});
						elem.children('div.layui-layer-content').height($this.height() - 95);
					});
				},
				success: function(layero, index) {
					//弹出窗口成功后渲染表单
					var form = layui.form();
					form.render();
					if(onLoadFinished){
						eval(onLoadFinished+"(form)");
					}
					var $form = $('form.layui-form');
					//
					if(dataurl && dataurl != ""){
						var loading = layer.load();
						$.getJSON(dataurl,function(result){
							layer.close(loading);
							oneplatform.dataRender($form,result.data);
						});
					}
					form.on('submit(submitbtn)', function(data) {
						var loading = layer.load();
						$.ajax({
							dataType:"json",
						    type: "POST",
						    contentType: "application/json",
					        url: $form.attr('action'),
					        data:JSON.stringify(data.field),
							complete: function(){layer.close(loading);},
							success: function(data){
								if(data.code==401){top.location.href = "/login.html";return;}
						        if(data.code == 200){
						        	oneplatform.success(data.msg || "操作成功");
						        	setTimeout(function(){layer.close(index);},500);
						        	 window.location.reload() ;
						        }else{
						        	oneplatform.error(data.msg || "操作失败");
						        }
						   },
							error: function(xhr, type){
								$this.removeAttr('disabled');
								oneplatform.error('系统错误');
							}
						});
						return false; 									
					});
				},
				end: function() {
					addBoxIndex = -1;
				}
			});
		});
	});
	//
	$('body').on('click','.J_confirm', function(){
		var self = $(this),
			url = self.attr('data-url'),
			method=self.attr('ajax-method') || 'GET',
			msg = self.attr('data-msg') || '您确认该操作吗',
			data = self.attr('data'),
			dataId = self.attr('data-id'),
			callback = self.attr('onSuccessCallback');
		
		if(!data && method.toUpperCase() === 'POST'){
			data = '{}';
		}
		if(dataId)url=url.replace('{id}',dataId);
		layer.confirm(msg, {
		    btn: ['确定','取消'], //按钮
		    shade: false //不显示遮罩

		}, function(index){
			$.ajax({
				dataType:"json",
			    type: method,
		        url: url,
		        data:data,
		        contentType: "application/json",
				complete: function(){layer.close(index);},
				success: function(result){
		        	if(result.code==401){top.location.href = "/login.html";return;}
					if(result.code == 200){
						oneplatform.success(result.msg);
						setTimeout(function(){
							if(callback != undefined){
								eval(callback);
							}else{
								window.location.reload();
							}
						},500);
					}else{
						oneplatform.error(result.msg);
					}
				}
			});
	        return false;
	    }, function(index){
	    	layer.close(index); 
		});
	});
	
	$('select[asnycSelect]').each(function(){
		var $this = $(this),url=$this.attr("asnycSelect"),onLoadFinished = $this.attr('onDataLoadCallback'); 
		$.getJSON(url,function(result){
			if(result.code != 200){oneplatform.error(result.msg);return;}
			var data = result.data;
			if(onLoadFinished){
				eval(onLoadFinished+"(data)");
			}
			var opthtml;
			for(var index in data){
				var selected = data[index].selected ? 'selected="selected"' : '';
				opthtml = '<option value="'+data[index].value+'" '+selected+'>'+data[index].text+'</option>';
				$this.append(opthtml);
			}
			form.render('select');
		});
	});
	
});
