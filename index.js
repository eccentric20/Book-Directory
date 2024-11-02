import express from 'express'
import ejs from 'ejs'
import bodyParser from 'body-parser'
import fs from 'fs'
import axios from 'axios'
import path, {dirname} from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static(__dirname));

app.get('/', async(req, res) => {
    res.render('index.ejs', {errorMessage: null});
})

app.get('/search', async(req, res) => {

    

    try{
        
        const data = fs.readFileSync(path.join(__dirname, 'bookDirectory.json'), 'utf-8');
        const books = JSON.parse(data);
        const randomIndex = Math.floor(Math.random() * books.length);
        const randomBook = books[randomIndex];

        const apiKey = 'AIzaSyD2Lt5ov8qNYJn63viWLNeFYm84k3ZoZPU'
        const url = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(randomBook.title)}&key=${apiKey}`;

        const response = await axios(url);
        const googleData = response.data;

        let imageUrl = '';
        if(googleData.items && googleData.items.length > 0){
            imageUrl = googleData.items[0].volumeInfo.imageLinks?.thumbnail || '';
        }

        res.render('ranbook.ejs', {
            tit_le: randomBook.title,
            aut_hor: randomBook.author,
            gen_re: randomBook.genre,
            year: randomBook.publication_year,
            goodreads: randomBook.goodreads_rating,
            imageUrl: imageUrl

        });
    }
    catch(error) {
        // console.log("Error: Unable to load book data.", error);
        // res.status(500).send("Error: Unable to load book data.");
        // const bookInfo = document.getElementById('book-info');
        // const errorMessage = document.createElement('h3');
        // errorMessage.textContent = "Error: Unable to load book data."
        // errorMessage.style.color = "Red";
        // bookInfo.appendChild(errorMessage);
        console.log("Error: Unable to load book data.", error);
        res.status(500).render('index.ejs', {
            errorMessage: "Error: Unable to load book data."
        })
    }
})

app.post('/submit', async(req,res) => {
    const {title, author, genre, publication_year, goodreads_rating} = req.body;

    const filePath = path.join(__dirname, 'bookDirectory.json');
    let books = [];

    try{
        if(fs.existsSync(filePath)){
            const data = fs.readFileSync(filePath, 'utf-8');
            books = JSON.parse(data);
        }
    }
    catch(error){
        console.error("Error reading JSON file", error);
        return res.status(500).send("Error reading JSON file");
    }

    const duplicate = books.some(book => book.title.toLowerCase() === title.toLowerCase());
    if(duplicate){
        return res.status(400).render('index.ejs', {errorMessage: "A book with this title already exists."});
    }

    const nextId = books.length > 0 ? Math.max(...books.map(book=>book.id)) + 1:1;

    const newBook = {
        id: nextId,
        title: title,
        author: author,
        genre: genre,
        publication_year: parseInt(publication_year, 10),
        goodreads_rating: parseFloat(goodreads_rating),
    };

    

    books.push(newBook);

    try{
        fs.writeFileSync(filePath, JSON.stringify(books, null, 2), 'utf-8');
        res.render('index.ejs', {errorMessage: null});
    }
    catch(error){
        console.error("Error writing to JSON file:", error);
        res.status(500).send("Error writing to JSON file");
    }






})





app.listen(port, () => {
  console.log(`Server is running on port ${port}`);  
})

