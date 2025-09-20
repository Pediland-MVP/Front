export namespace UploadNamespace {

    export interface POST {
        Image: Image
    }

}


export interface Image {
    memeType:    string;
    name:        string;
    url:         string;
    tubmnailUrl: string;
    size:        number;
    key:         string;
    id:          number;
    createDate:  Date;
    updateDate:  Date;
}
