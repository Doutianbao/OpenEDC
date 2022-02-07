import * as metadataWrapper from "../odmwrapper/metadatawrapper.js";
import * as clinicaldataWrapper from "../odmwrapper/clinicaldatawrapper.js";

export const getCSVString = async () => {
    const itemPaths = metadataWrapper.getItemPaths();
    const subjectData = await clinicaldataWrapper.getAllData({ includeInfo: true });

    // Start with an empty CSV string only and add the item OIDs as headers
    let csvString = ",,,";
    csvString += itemPaths.map(path => path.toString().replace(/,/g, "")).join(",") + "\n";

    // Then, add the subject column as well as the creation date and add the item names as headers to the CSV string
    csvString += "Subject,Creation_Date,Creation_Time,";
    csvString += itemPaths.map(path => metadataWrapper.getElementDefByOID(path.itemOID).getName()).join(",") + "\n";

    // Second, add the creation date and clinical data for each subject
    for (let [key, value] of Object.entries(subjectData)) {
        csvString += key + ",";
        csvString += value["createdDate"] + ",";
        csvString += value["createdTime"] + ",";
        csvString += itemPaths.map(path => formatValue(value[path.toString()])).join(",") + "\n";
    }

    return csvString;
}

const formatValue = value => {
    value = value ? value.replace(/'/g, '"').replace(/"/g, '""'): "";
    return value.includes(",") ? '"' + value + '"' : value
}
