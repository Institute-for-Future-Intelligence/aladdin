/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: {
          name: {
            IFI: 'Institute for Future Intelligence',
            Aladdin: 'Aladdin',
          },
          word: {
            Version: 'Version',
            Options: 'Options',
            NorthInitial: 'N',
            SouthInitial: 'S',
            EastInitial: 'E',
            WestInitial: 'W',
          },
          menu: {
            fileSubMenu: 'File',
            file: {
              OpenLocalFile: 'Open Local File',
              SaveToDownloadFolder: 'Save to Download Folder',
              TakeScreenshot: 'Take Screenshot',
            },
            viewSubMenu: 'View',
            view: {
              TwoDimensionalView: '2D View',
              SiteInformation: 'Site Information',
              Map: 'Map',
              WeatherData: 'Weather Data',
              StickyNote: 'Sticky Note',
            },
            sensorsSubMenu: 'Sensors',
            sensors: {
              CollectDailyData: 'Collect Daily Data',
              CollectYearlyData: 'Collect Yearly Data',
            },
            solarPanelsSubMenu: 'Solar Panels',
            solarPanels: {
              AnalyzeDailyYield: 'Analyze Daily Yield',
              AnalyzeYearlyYield: 'Analyze Yearly Yield',
            },
            examplesSubMenu: 'Examples',
            examples: {
              SolarRadiationToBox: 'Solar Radiation to a Box',
              SunBeamAndHeliodon: 'Sun Beam and Heliodon',
              SolarFarm: 'Solar Farm',
              SolarFarmInRealWorld: 'Solar Farm in the Real World',
              SolarTrackers: 'Solar Trackers',
              SimpleHouse: 'Simple House',
              OfficeBuilding: 'Office Building',
            },
            languageSubMenu: 'Language',
            AboutUs: 'About Us',
          },
          avatarMenu: {
            SaveFileToCloud: 'Save File to Cloud',
            MyCloudFiles: 'My Cloud Files',
            AccountSettings: 'Account Settings',
            SignIn: 'Sign In',
            SignOut: 'Sign Out',
          },
          toolbar: {
            Select: 'Select',
            AddFoundation: 'Add foundation',
            AddWall: 'Add wall',
            AddWindow: 'Add window',
            AddRoof: 'Add roof',
            AddCuboid: 'Add cuboid',
            AddSensor: 'Add sensor',
            AddSolarPanel: 'Add solar panel',
            AddTree: 'Add tree',
            AddPeople: 'Add people',
            ClearScene: 'Clear scene',
            ResetView: 'Reset view',
            AutoRotate: 'Auto rotate',
            ShowHeliodonPanel: 'Show heliodon panel',
            ShowShadow: 'Show shadow',
          },
          tooltip: {
            gotoIFI: 'Go to Institute for Future Intelligence',
            visitAladdinHomePage: 'Visit Aladdin Homepage',
            clickToOpenMenu: 'Click to open main menu',
            clickToAccessCloudTools: 'Click to access cloud tools',
          },
        },
      },

      zh_cn: {
        translation: {
          name: {
            IFI: '未来智能研究所',
            Aladdin: '阿拉丁',
          },
          word: {
            Version: '版本',
            Options: '选项',
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
            },
            solarPanelsSubMenu: '太阳能光伏板',
            solarPanels: {
              AnalyzeDailyYield: '分析当天产出',
              AnalyzeYearlyYield: '分析全年产出',
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
            MyCloudFiles: '我的云端文件',
            AccountSettings: '账号设定',
            SignIn: '登录',
            SignOut: '退出账号',
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
          },
          tooltip: {
            gotoIFI: '访问未来智能研究所',
            visitAladdinHomePage: '访问阿拉丁主页',
            clickToOpenMenu: '点击打开主菜单',
            clickToAccessCloudTools: '点击打开云菜单',
          },
        },
      },

      zh_tw: {
        translation: {
          name: {
            IFI: '未來智能研究所',
            Aladdin: '阿拉丁',
          },
          word: {
            Version: '版本',
            Options: '選項',
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
      },

      es: {
        translation: {
          name: {
            IFI: 'Instituto de Inteligencia del Futuro',
            Aladdin: 'Aladino',
          },
          word: {
            Version: 'Versión',
            Options: 'Options',
            NorthInitial: 'N',
            SouthInitial: 'S',
            EastInitial: 'E',
            WestInitial: 'W',
          },
          menu: {
            fileSubMenu: 'Documento',
            file: {
              OpenLocalFile: 'Open Local File',
              SaveToDownloadFolder: 'Save to Download Folder',
              TakeScreenshot: 'Take Screenshot',
            },
            viewSubMenu: 'View',
            view: {
              TwoDimensionalView: '2D View',
              SiteInformation: 'Site Information',
              Map: 'Map',
              WeatherData: 'Weather Data',
              StickyNote: 'Sticky Note',
            },
            sensorsSubMenu: 'Sensors',
            sensors: {
              CollectDailyData: 'Collect Daily Data',
              CollectYearlyData: 'Collect Yearly Data',
            },
            solarPanelsSubMenu: 'Solar Panels',
            solarPanels: {
              AnalyzeDailyYield: 'Analyze Daily Yield',
              AnalyzeYearlyYield: 'Analyze Yearly Yield',
            },
            examplesSubMenu: 'Examples',
            examples: {
              SolarRadiationToBox: 'Solar Radiation to a Box',
              SunBeamAndHeliodon: 'Sun Beam and Heliodon',
              SolarFarm: 'Solar Farm',
              SolarFarmInRealWorld: 'Solar Farm in the Real World',
              SolarTrackers: 'Solar Trackers',
              SimpleHouse: 'Simple House',
              OfficeBuilding: 'Office Building',
            },
            languageSubMenu: 'Language',
            AboutUs: 'About Us',
          },
          avatarMenu: {
            SaveFileToCloud: 'Save File to Cloud',
            MyCloudFiles: 'My Cloud Files',
            AccountSettings: 'Account Settings',
            SignIn: 'Sign In',
            SignOut: 'Sign Out',
          },
          toolbar: {
            Select: 'Select',
            AddFoundation: 'Add foundation',
            AddWall: 'Add wall',
            AddWindow: 'Add window',
            AddRoof: 'Add roof',
            AddCuboid: 'Add cuboid',
            AddSensor: 'Add sensor',
            AddSolarPanel: 'Add solar panel',
            AddTree: 'Add tree',
            AddPeople: 'Add people',
            ClearScene: 'Clear scene',
            ResetView: 'Reset view',
            AutoRotate: 'Auto rotate',
            ShowHeliodonPanel: 'Show heliodon panel',
            ShowShadow: 'Show shadow',
          },
          tooltip: {
            gotoIFI: 'Ir al Instituto de Inteligencia del Futuro',
            visitAladdinHomePage: 'Visita la página de inicio de Aladdin',
            clickToOpenMenu: 'Haga clic para abrir el menú',
            clickToAccessCloudTools: 'Click to access cloud tools',
          },
        },
      },

      tr: {
        translation: {
          name: {
            IFI: 'Geleceğin İstihbaratı Enstitüsü',
            Aladdin: 'Alaaddin',
          },
          word: {
            Version: 'Sürüm',
            Options: 'Options',
            NorthInitial: 'N',
            SouthInitial: 'S',
            EastInitial: 'E',
            WestInitial: 'W',
          },
          menu: {
            fileSubMenu: 'Dosya',
            file: {
              OpenLocalFile: 'Open Local File',
              SaveToDownloadFolder: 'Save to Download Folder',
              TakeScreenshot: 'Take Screenshot',
            },
            viewSubMenu: 'View',
            view: {
              TwoDimensionalView: '2D View',
              SiteInformation: 'Site Information',
              Map: 'Map',
              WeatherData: 'Weather Data',
              StickyNote: 'Sticky Note',
            },
            sensorsSubMenu: 'Sensors',
            sensors: {
              CollectDailyData: 'Collect Daily Data',
              CollectYearlyData: 'Collect Yearly Data',
            },
            solarPanelsSubMenu: 'Solar Panels',
            solarPanels: {
              AnalyzeDailyYield: 'Analyze Daily Yield',
              AnalyzeYearlyYield: 'Analyze Yearly Yield',
            },
            examplesSubMenu: 'Examples',
            examples: {
              SolarRadiationToBox: 'Solar Radiation to a Box',
              SunBeamAndHeliodon: 'Sun Beam and Heliodon',
              SolarFarm: 'Solar Farm',
              SolarFarmInRealWorld: 'Solar Farm in the Real World',
              SolarTrackers: 'Solar Trackers',
              SimpleHouse: 'Simple House',
              OfficeBuilding: 'Office Building',
            },
            languageSubMenu: 'Language',
            AboutUs: 'About Us',
          },
          avatarMenu: {
            SaveFileToCloud: 'Save File to Cloud',
            MyCloudFiles: 'My Cloud Files',
            AccountSettings: 'Account Settings',
            SignIn: 'Sign In',
            SignOut: 'Sign Out',
          },
          toolbar: {
            Select: 'Select',
            AddFoundation: 'Add foundation',
            AddWall: 'Add wall',
            AddWindow: 'Add window',
            AddRoof: 'Add roof',
            AddCuboid: 'Add cuboid',
            AddSensor: 'Add sensor',
            AddSolarPanel: 'Add solar panel',
            AddTree: 'Add tree',
            AddPeople: 'Add people',
            ClearScene: 'Clear scene',
            ResetView: 'Reset view',
            AutoRotate: 'Auto rotate',
            ShowHeliodonPanel: 'Show heliodon panel',
            ShowShadow: 'Show shadow',
          },
          tooltip: {
            gotoIFI: "Geleceğin İstihbarat Enstitüsü'ne gidin",
            visitAladdinHomePage: 'Aladdin Ana Sayfasını Ziyaret Edin',
            clickToOpenMenu: 'Menüyü açmak için tıklayın',
            clickToAccessCloudTools: 'Click to access cloud tools',
          },
        },
      },
    },
  });

export default i18n;
