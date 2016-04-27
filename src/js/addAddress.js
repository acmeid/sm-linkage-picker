define("page/mall/addAddress.js", [ "js/zepto.min.js", "plugins/zepto.cookie.js", "plugins/template.js", "plugins/tool.js", "js/sm.min.js", "plugins/sm-city-picker.js", "js/fastclick.min.js" ], function(require, exports, module) {
    
//此页面为新增地址和编辑地址共用

    var $ = require("js/zepto.min.js").$;
    var template = require("plugins/template.js");
    var tool = require("plugins/tool.js");
    FastClick.attach(document.body);

    require("js/sm.min.js");
    // require("plugins/sm-city-picker.js");
    require("plugins/zepto.cookie.js");

    var uapi = {
        address: 'host_path/shipment/addresses',
        editAddress: 'host_path/shipment/addresses/edit',
        areas: 'host_path/shipment/areas',
    }

    var udata = {
        accessToken: $.fn.cookie('access_token') || '',
        province: [],
        city: [],
        region: [],
        editItem: JSON.parse(sessionStorage.editItem || 'false'), //要编辑的项目
        first: sessionStorage.editItem ? true : false,
        selectAddress: JSON.parse(sessionStorage.selectAddress || '{}'), //选择的地址

        // redirect: JSON.parse(sessionStorage.add_address_redirect || 'null'), //重定向地址

        province: {
            values: ['省份'],
            codes: [null],
            currentValue: null,
            currentCode: null
        },
        city: {
            values: ['城市'],
            codes: [null],
            currentValue: null,
            currentCode: null
        },
        area: {
            values: ['区/县'],
            codes: [null],
            currentValue: null,
            currentCode: null
        },
        
    }

    var uinit = function () {
        umethod.submitOrder();

        if(udata.editItem){//编辑地址
            umethod.initEdit();
        }else{//新增地址
            umethod.getAreas(0,'province',function(data){
                umethod.cityPicker();
            });
        }

        umethod.appHideHeader();
    }

    var umethod = {
        initEdit: function () {
            var area_code = udata.editItem.area_code.split(' ');
            var area_name_k = udata.editItem.area;
            var area_name = udata.editItem.area.split(' ');

            $('#name').val(udata.editItem.recipient);
            $('#phone').val(udata.editItem.mobile);
            $('#street').val(udata.editItem.street);

            if(area_code.length === 3){
                $('#city-picker').val(udata.editItem.area_code);
            }else{
                $('#city-picker').val(udata.editItem.area_code + ' null');
            }

            $('#areas .def').text(area_name_k).show();

            udata.province.currentCode = area_code[0];
            udata.city.currentCode = area_code[1];
            if(area_code[2]) udata.area.currentCode = area_code[2];

            udata.province.currentValue = area_name[0];
            udata.city.currentValue = area_name[1];
            if(area_name[2]) udata.area.currentValue = area_name[2];

            umethod.getAreas(0,'province',function(data){
                umethod.getAreas(area_code[0],'city',function(data){
                    // if(area_code[2]){
                        umethod.getAreas(area_code[1],'area',function(data){
                            umethod.cityPicker();
                        });
                    // }else{
                    //     umethod.cityPicker();
                    // }
                    
                });
            });
        },
        getAreas: function (pCode,type,callBack) {
            $.ajax({ 
                url: uapi.areas,
                data: {pCode: pCode}
            })
            .done(function(data){
                if (data.errcode === undefined) {
                    if(data && data.length){
                        udata[type].values = [];
                        udata[type].codes = [];
                        $.each(data,function(index,item){
                            udata[type].values.push(item.label);
                            udata[type].codes.push(item.code);
                        })
                        if(!udata.first){
                            udata[type].currentValue = data[0].label;
                            udata[type].currentCode = data[0].code;
                        }
                    }else{
                        udata[type].values = ['区/县']
                        udata[type].codes = [null]
                    }
                    
                    callBack && callBack(data)
                }else{
                    tool.tip("网络错误");
                }
            })
        },
        initPopup: function () {
            $(document).on('click','#areas', function () {
                $.popup('.popup-areas');
                
            }).on('click', '.popup-overlay.modal-overlay-visible', function(){
                $.closeModal('.popup-areas')
            });
        },
        cityPicker: function () {
            var This = this;

            $('#areas').on('click', function(){
                // $('#city-picker').click();
                $("#city-picker").picker("open");
            })
            
            $("#city-picker").picker({
              toolbarTemplate: '<header class="bar bar-nav">\
              <button class="button button-link pull-right close-picker">确定</button>\
              <h1 class="title">请选择地址</h1>\
              </header>',
              cssClass: "city-picker",
              rotateEffect: false,  //为了性能
              cols: [
                {
                  textAlign: 'center',
                  displayValues: udata.province.values,
                  values: udata.province.codes,
                  displayValue: '123'
                },
                {
                  textAlign: 'center',
                  displayValues: udata.city.values,
                  values: udata.city.codes
                },
                {
                  textAlign: 'center',
                  displayValues: udata.area.values,
                  values: udata.area.codes
                }
              ],
              onChange: function(picker,values,displayValues){
                if(udata.first){
                    udata.first = false;
                    $('#areas .def').hide();
                    return;
                }
                var provinceValue = picker.cols[0].displayValue;
                var provinceCode = picker.cols[0].value;
                var cityValue = picker.cols[1].displayValue;
                var cityCode = picker.cols[1].value;
                var areaValue = picker.cols[2].displayValue;
                var areaCode = picker.cols[2].value;

                var t;

                if(provinceCode !== udata.province.currentCode) {
                    clearTimeout(t);

                    udata.province.currentValue = provinceValue;
                    udata.province.currentCode = provinceCode;
                    picker.cols[1].replaceValues([null],['加载中...']);

                    t = setTimeout(function(){
                        umethod.getAreas(udata.province.currentCode,'city',function(data){
                            if(udata.area.codes[0] !== null){
                                $('.picker-items-col').addClass('picker-Three');
                            }else{
                                $('.picker-items-col').removeClass('picker-Three');
                            }

                            picker.cols[1].replaceValues(udata.city.codes,udata.city.values);
                            picker.updateValue();
                        });
                    }, 300);
                }
                else if(cityCode !== udata.city.currentCode){
                    clearTimeout(t);

                    udata.city.currentValue = cityValue;
                    udata.city.currentCode = cityCode;
                    picker.cols[2].replaceValues([null],['加载中...']);

                    t = setTimeout(function(){
                        umethod.getAreas(udata.city.currentCode,'area',function(data){
                            if(udata.area.codes[0] !== null){
                                $('.picker-items-col').addClass('picker-Three');
                            }else{
                                $('.picker-items-col').removeClass('picker-Three');
                            }

                            picker.cols[2].replaceValues(udata.area.codes,udata.area.values);
                            picker.updateValue();
                        });
                    }, 300);
                }

                if(areaCode !== udata.area.areaCode){

                    udata.area.currentValue = areaValue;
                    udata.area.currentCode = areaCode;
                }
              },
              onClose: function (picker) {

              },
              onOpen: function (picker) {
                // if(udata.first){
                //     udata.first = true;
                // }
                if(udata.area.codes[0] !== null){
                    $('.picker-items-col').addClass('picker-Three');
                }else{
                    $('.picker-items-col').removeClass('picker-Three');
                }
              },
              formatValue: function (picker, value, displayValue){

                if(displayValue[2] === '区/县'){
                    displayValue.length = 2;
                }
                displayValue = displayValue.join(' ');

                return displayValue
              }
            });

            $('.add-address .content').show();
        },
        submitOrder: function () {
            // 提交
            $("#submit").on('click',function(){
                var areaCode;
                var url;

                if(udata.area.currentCode && udata.area.currentCode  !== 'null'){
                    areaCode = udata.area.currentCode;
                }else if(udata.city.currentCode){
                    areaCode = udata.city.currentCode;
                }

                var params = {
                    accessToken: udata.accessToken,
                    recipient: $('#name').val(),
                    mobile: $('#phone').val(),
                    // areaCode: $('#region').val(),
                    areaCode: areaCode,
                    street: $('#street').val(),
                    isDefault: 1
                }

                if(udata.editItem){
                    params.addressId = udata.editItem._id.$id;
                    url = uapi.editAddress
                }else{
                    url = uapi.address
                }

                if(!params.recipient){
                    tool.tip("请输入收件人");
                    return;
                }else if(!params.mobile || !/^(0|86|17951)?(13[0-9]|15[012356789]|17[678]|18[0-9]|14[57])[0-9]{8}$/.test(params.mobile)){
                    tool.tip("请输入正确的手机号码");
                    return;
                }
                else if(!params.areaCode){
                    tool.tip("请选择所在地区");
                    return;
                }
                else if(!params.street){
                    tool.tip("请输入详细地址");
                    return;
                }

                $.ajax({ 
                    url: url,
                    beforeSend: function()
                    {
                        $.showIndicator();
                    },
                    data: params,
                    type: 'POST'
                })
                .done(function(data){
                    if (data.errcode === undefined) {
                        console.log('保存成功');
                        setTimeout(function(){
                            sessionStorage.optionAddress = 'true';
                            if(udata.selectAddress.area){
                                sessionStorage.removeItem("selectAddress");
                                sessionStorage.removeItem("defAddress");
                                history.go(-2);
                            }else{
                                history.go(-1);
                            }
                        },100)
                        
                    }else{
                        tool.tip("网络错误");
                    }
                    $.hideIndicator();
                })
                
            });
        },
        appHideHeader: function(){
            var ua = window.navigator.userAgent.toLowerCase();
            var isApp = false;
            if(ua.match(/MicroMessenger/i) != "micromessenger"){
                if(ua.match(/windows/i) != "windows"){
                    isApp = true;
                }
            }
            var html = template("navbar", {
                isApp: isApp
            });
            $("#add-address").prepend(tool.checkTplError(html));
        }
    }

    var ufilter = {

    }

    uinit()
});