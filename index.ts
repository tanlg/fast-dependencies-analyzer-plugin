class Book {
    public data: any[];
    constructor(data: any[]) {
        this.data = data;
    }
}

const a: Book = new Book([{}]);
console.log(a.data)