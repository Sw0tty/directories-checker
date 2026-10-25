/**
 * @ 1 - file not exist in other tree;
 * @ 2 - file exist in both trees;
 * @ 3 - size difference;
 * @ 4 - mime element;
 * @ 5 - last mod difference;
 */
export enum FileStatuses {
    NotExist = 1,
    ExistInBothTrees = 2,
    SizeDifference = 3,
    MimeElement = 4,
    LastModDifference = 5,
}
