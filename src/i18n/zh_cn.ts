/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export const i18n_zh_cn = {
  translation: {
    name: {
      IFI: '未来智能研究所',
      Aladdin: '阿拉丁',
    },

    aboutUs: {
      ProductBroughtToYouBy: '未来智能研究所荣誉出品',
      TermsOfService: '服务条款',
      PrivacyPolicy: '隐私政策',
      Software: '软件',
      Content: '课件',
      Research: '研究',
      Support: '服务',
      Acknowledgment: '鸣谢',
      FundingInformation:
        '本产品的研发承蒙美国国家科学基金会慷慨资助（项目号#2105695和#2131097）。本产品的任何观点或结论仅代表作者个人意见。',
    },

    word: {
      Version: '版本',
      Options: '选项',
      Open: '打开',
      Save: '保存',
      SaveAsImage: '保存为图像',
      Update: '刷新',
      Paste: '粘贴',
      Copy: '复制',
      Cut: '剪切',
      Delete: '删除',
      Lock: '固定',
      Color: '颜色',
      OK: '确定',
      Cancel: '取消',
      Close: '关闭',
      Clear: '清空',
      Length: '长度',
      Width: '宽度',
      Height: '高度',
      Angle: '角度',
      Weather: '天气',
      Show: '显示',
      Animate: '动画',
      Date: '日期',
      Time: '时间',
      Title: '标题',
      Owner: '所有者',
      Action: '操作',
      Rename: '改名',
      Latitude: '纬度',
      Month: '月',
      Day: '天',
      Hour: '小时',
      Daylight: '白天长度',
      Radiation: '辐射',
      Temperature: '温度',
      NorthInitial: '北',
      SouthInitial: '南',
      EastInitial: '东',
      WestInitial: '西',
    },

    menu: {
      fileSubMenu: '文件',
      file: {
        OpenLocalFile: '打开本地文件',
        SaveToDownloadFolder: '保存到下载文件夹',
        DownloadAs: '下载文件名',
        SavingAbortedMustHaveValidFileName: '文件名无效，保存失败',
        TakeScreenshot: '截屏',
      },
      viewSubMenu: '视界',
      view: {
        TwoDimensionalView: '二维模式',
        SiteInformation: '地理位置信息',
        Map: '地图',
        WeatherData: '气象数据',
        StickyNote: '便签',
      },
      sensorsSubMenu: '传感器',
      sensors: {
        CollectDailyData: '收集当天数据',
        CollectYearlyData: '收集全年数据',
        SamplingFrequency: '采样频率',
        TimesPerHour: '每小时次数',
      },
      solarPanelsSubMenu: '太阳能光伏板',
      solarPanels: {
        AnalyzeDailyYield: '分析当天产出',
        AnalyzeYearlyYield: '分析全年产出',
        PanelDiscretization: '光伏板离散化方法',
        Exact: '准确',
        Approximate: '近似',
      },
      examplesSubMenu: '例子',
      examples: {
        SolarRadiationToBox: '一个箱体受到的太阳能辐射分析',
        SunBeamAndHeliodon: '太阳光束和日影仪',
        SolarFarm: '太阳能农场',
        SolarFarmInRealWorld: '模拟一个真实世界里的太阳能农场',
        SolarTrackers: '自动追日器',
        SimpleHouse: '一栋简单的房屋',
        OfficeBuilding: '一栋简单的办公楼',
      },
      languageSubMenu: '语言',
      AboutUs: '关于我们',
    },

    avatarMenu: {
      SaveFileToCloud: '保存文件到云端',
      SavingAbortedMustHaveValidTitle: '文件名无效，保存失败',
      MyCloudFiles: '我的云端文件',
      AccountSettings: '账号设定',
      SignIn: '登录',
      SignOut: '退出账号',
    },

    skyMenu: {
      Axes: '显示坐标轴',
      Theme: '环境主题',
      ThemeDefault: '默认',
      ThemeDesert: '沙漠',
      ThemeForest: '森林',
      ThemeGrassland: '草原',
    },

    groundMenu: {
      Albedo: '反照率',
      ImageOnGround: '地面显示图像',
      RemoveAllTrees: '删除所有树木',
      RemoveAllPeople: '删除所有人物',
    },

    foundationMenu: {
      RemoveAllSolarPanels: '删除此地基上的所有光伏板',
      RemoveAllSensors: '删除此地基上的所有传感器',
      Racks: '支架',
    },

    cuboidMenu: {
      RemoveAllSolarPanels: '删除此长方体表面上的所有光伏板',
      RemoveAllSensors: '删除此长方体表面上的所有传感器',
      Racks: '支架',
    },

    treeMenu: {
      ShowModel: '显示近似模型',
      Type: '树种',
      Spread: '树冠直径',
    },

    peopleMenu: {
      ChangePerson: '改变人物',
    },

    sensorMenu: {
      Label: '标签',
      KeepShowingLabel: '显示标签',
    },

    solarPanelMenu: {
      ChangePvModel: '改变光伏板型号',
      Orientation: '排列方向',
      Portrait: '纵向',
      Landscape: '橫向',
      Panels: '块',
      TiltAngle: '倾斜角度',
      RelativeAzimuth: '相对方位角',
      Tracker: '追日系统',
      PoleHeight: '支架高度',
      PoleSpacing: '支架间隔',
      DrawSunBeam: '显示光柱',
      Label: '标签',
      KeepShowingLabel: '显示标签',
    },

    pvModelPanel: {
      SolarPanelSpecs: '光伏板型号性能',
      Model: '型号',
      PanelSize: '尺寸',
      CellType: '光伏电池类型',
      Monocrystalline: '单晶硅',
      Polycrystalline: '多晶硅',
      ThinFilm: '薄膜',
      Black: '黑色',
      Blue: '蓝色',
      ShadeTolerance: '阴影耐受度',
      SolarCellEfficiency: '光伏电池效率',
      NominalOperatingCellTemperature: '名义电池运行温度',
      TemperatureCoefficientOfPmax: 'Pmax温度系数',
    },

    infoPanel: {
      High: '最高温度',
      Low: '最低温度',
    },

    mapPanel: {
      ImageOnGround: '地面显示图像',
      StationsOnMap: '显示气象站位置',
      Coordinates: '经纬度坐标',
      Zoom: '放大程度',
    },

    sensorPanel: {
      LightSensor: '光传感器',
      WeatherDataFrom: '气象数据来自',
    },

    heliodonPanel: {
      HeliodonSettings: '日影仪设置',
    },

    cloudFilePanel: {
      MyCloudFiles: '我的云文件',
      GenerateLink: '生成链接',
      LinkGeneratedInClipBoard: '链接已经复制到剪贴板',
      DoYouReallyWantToDelete: '您确定删除此文件',
    },

    accountSettingsPanel: {
      MyAccountSettings: '我的账户设定',
    },

    weatherPanel: {
      SunshineHours: '日照时间',
    },

    yearlyLightSensorPanel: {
      SkyClearness: '天空清晰度',
      ShowDaylightResults: '显示日照时间结果',
      ShowSkyClearnessResults: '显示天空清晰度结果',
      ShowAverageDailySolarRadiation: '显示日平均辐射结果',
    },

    toolbar: {
      Select: '选择',
      AddFoundation: '添加地基',
      AddWall: '添加墙体',
      AddWindow: '添加窗户',
      AddRoof: '添加屋顶',
      AddCuboid: '添加长方体',
      AddSensor: '添加传感器',
      AddSolarPanel: '添加光伏板',
      AddTree: '添加树木',
      AddPeople: '添加人物',
      ClearScene: '清空场景',
      ResetView: '重置视角',
      AutoRotate: '自动旋转',
      ShowHeliodonPanel: '显示日影仪面板',
      ShowShadow: '显示阴影',
      DoYouReallyWantToClearContent: '您确定清空场景吗',
    },

    tooltip: {
      gotoIFI: '访问未来智能研究所',
      visitAladdinHomePage: '访问阿拉丁主页',
      clickToOpenMenu: '点击打开主菜单',
      clickToAccessCloudTools: '点击打开云菜单',
    },
  },
};
