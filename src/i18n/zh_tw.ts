/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export const i18n_zh_tw = {
  translation: {
    name: {
      IFI: '未來智能研究所',
      Aladdin: '阿拉丁',
    },

    word: {
      Version: '版本',
      Options: '選項',
      Open: '打開',
      Save: '保存',
      SaveAsImage: '保存為圖像',
      Update: '刷新',
      Paste: '粘貼',
      Copy: '複製',
      Cut: '剪切',
      Delete: '删除',
      Lock: '固定',
      Color: '顏色',
      OK: '確定',
      Cancel: '取消',
      Close: '關閉',
      Clear: '清空',
      Length: '長度',
      Width: '寬度',
      Height: '高度',
      Angle: '角度',
      Weather: '天氣',
      Show: '顯示',
      Animate: '動畫',
      Date: '日期',
      Time: '時間',
      Title: '標題',
      Owner: '所有者',
      Action: '操作',
      Rename: '改名',
      Latitude: '緯度',
      NorthInitial: '北',
      SouthInitial: '南',
      EastInitial: '東',
      WestInitial: '西',
    },

    menu: {
      fileSubMenu: '文檔',
      file: {
        OpenLocalFile: '打開本地文檔',
        SaveToDownloadFolder: '保存到下載文檔夾',
        TakeScreenshot: '截屏',
      },
      viewSubMenu: '視界',
      view: {
        TwoDimensionalView: '二維模式',
        SiteInformation: '地理位置資訊',
        Map: '地圖',
        WeatherData: '氣象數據',
        StickyNote: '便簽',
      },
      sensorsSubMenu: '傳感器',
      sensors: {
        CollectDailyData: '收集當天數據',
        CollectYearlyData: '收集全年數據',
      },
      solarPanelsSubMenu: '太陽能光伏板',
      solarPanels: {
        AnalyzeDailyYield: '分析當天產出',
        AnalyzeYearlyYield: '分析全年產出',
      },
      examplesSubMenu: '例子',
      examples: {
        SolarRadiationToBox: '一個箱體受到的太陽能輻射分析',
        SunBeamAndHeliodon: '太陽光束和日影儀',
        SolarFarm: '太陽能農場',
        SolarFarmInRealWorld: '模擬一個真實世界裡的太陽能農場',
        SolarTrackers: '自動追日器',
        SimpleHouse: '一棟簡單的房屋',
        OfficeBuilding: '一棟簡單的寫字樓',
      },
      languageSubMenu: '語言',
      AboutUs: '關於我們',
    },

    avatarMenu: {
      SaveFileToCloud: '保存文檔到雲端',
      MyCloudFiles: '我的雲端文檔',
      AccountSettings: '賬號設定',
      SignIn: '登錄',
      SignOut: '退出賬號',
    },

    skyMenu: {
      Axes: '顯示坐標軸',
      Theme: '環境主題',
      ThemeDefault: '默認',
      ThemeDesert: '沙漠',
      ThemeForest: '森林',
      ThemeGrassland: '草原',
    },

    groundMenu: {
      Albedo: '反照率',
      ImageOnGround: '地面顯示圖像',
      RemoveAllTrees: '刪除所有樹木',
      RemoveAllPeople: '删除所有人物',
    },

    foundationMenu: {
      RemoveAllSolarPanels: '刪除此地基上的所有光伏板',
      RemoveAllSensors: '刪除此地基上的所有傳感器',
      Racks: '支架',
    },

    cuboidMenu: {
      RemoveAllSolarPanels: '刪除此長方體表面上的所有光伏板',
      RemoveAllSensors: '刪除此長方體表面上的所有傳感器',
      Racks: '支架',
    },

    treeMenu: {
      ShowModel: '顯示近似模型',
      Type: '樹種',
      Spread: '樹冠直徑',
    },

    peopleMenu: {
      ChangePerson: '改變人物',
    },

    sensorMenu: {
      Label: '標籤',
      KeepShowingLabel: '顯示標籤',
    },

    solarPanelMenu: {
      ChangePvModel: '改變光伏板型號',
      Orientation: '排列方向',
      Portrait: '縱向',
      Landscape: '橫向',
      Panels: '塊',
      TiltAngle: '傾斜角度',
      RelativeAzimuth: '相對方位角',
      Tracker: '追日系統',
      PoleHeight: '支架高度',
      PoleSpacing: '支架間隔',
      DrawSunBeam: '顯示光柱',
      Label: '標籤',
      KeepShowingLabel: '顯示標籤',
    },

    pvModelPanel: {
      SolarPanelSpecs: '光伏板型號性能',
      Model: '型號',
      PanelSize: '尺寸',
      CellType: '光伏電池類型',
      Monocrystalline: '單晶矽',
      Polycrystalline: '多晶矽',
      ThinFilm: '薄膜',
      Black: '黑色',
      Blue: '藍色',
      ShadeTolerance: '陰影耐受度',
      SolarCellEfficiency: '光伏電池效率',
      NominalOperatingCellTemperature: '名義電池運行溫度',
      TemperatureCoefficientOfPmax: 'Pmax溫度係數',
    },

    infoPanel: {
      High: '最高溫度',
      Low: '最低温度',
    },

    mapPanel: {
      ImageOnGround: '地面顯示圖像',
      StationsOnMap: '顯示氣象站位置',
      Coordinates: '經緯度坐標',
      Zoom: '放大程度',
    },

    sensorPanel: {
      LightSensor: '光傳感器',
      WeatherDataFrom: '氣象數據來自',
    },

    heliodonPanel: {
      HeliodonSettings: '日影儀設置',
    },

    cloudFilePanel: {
      MyCloudFiles: '我的雲文件',
      GenerateLink: '生成鏈接',
      LinkGeneratedInClipBoard: '鏈接已經復製到剪貼板',
    },

    toolbar: {
      Select: '選擇',
      AddFoundation: '添加地基',
      AddWall: '添加牆體',
      AddWindow: '添加窗戶',
      AddRoof: '添加屋頂',
      AddCuboid: '添加長方體',
      AddSensor: '添加傳感器',
      AddSolarPanel: '添加光伏板',
      AddTree: '添加樹木',
      AddPeople: '添加人物',
      ClearScene: '清空場景',
      ResetView: '重置視角',
      AutoRotate: '自動旋轉',
      ShowHeliodonPanel: '顯示日影儀面板',
      ShowShadow: '顯示陰影',
    },

    tooltip: {
      gotoIFI: '訪問未來智能研究所',
      visitAladdinHomePage: '訪問阿拉丁主頁',
      clickToOpenMenu: '點擊打開主菜單',
      clickToAccessCloudTools: '點擊打開雲菜單',
    },
  },
};
