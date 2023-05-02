import * as languageHelper from "../../js/helper/languagehelper.js";

export default async () => {

   languageHelper.registerTranslationFile("en", new URL("./translations/en.json", import.meta.url))
   languageHelper.registerTranslationFile("zh", new URL("./translations/zh.json", import.meta.url))
}

window.loadMypluginValue = function (currentOID, newValueCallback) {
   newValueCallback(`string for element with oid ${currentOID}`);
}
