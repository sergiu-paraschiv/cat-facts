const Koa = require('koa');
const Router = require('koa-router');
const Yargs = require('yargs');
const Sqlite = require('sqlite3');
const { open } = require('sqlite');


const PORT = process.env.PORT;
let FACTS = [];

const app = new Koa();
const router = new Router();

const aboutCommand = {
    command: 'about',
    description: 'Information about Cat Facts Over 9000',
    handler: ctx => {
        ctx.response.body = `Welcome to 'Cat Facts Over 9000' - the ultimate cat facts database for cat enthusiasts!
Get ready to embark on a whisker-twitching journey through the enchanting world of cats, where every tidbit is claw-some and every fact will have you feline fine.
So, paws everything else, and let's dive into a purr-adise of cat-tastic knowledge!"

Type \`/cat-facts info\` to find information about using this database!`;
    }
};

const helpCommand = {
    command: 'info',
    description: 'Get help using Cat Facts Over 9000',
    handler: ctx => {
        ctx.response.body = `Type \`/cat-facts\` to get a random cat fact.
Type \`/cat-facts fat\` to get a fact about fat cats.
Type \`/cat-facts cats\` to get a list of fact categories.
`;
    }
};

const categoriesCommand = {
    command: 'cats',
    description: 'Get available categories',
    handler: ctx => {
        const categories = [];

        for (const fact of FACTS) {
            if (fact.tag && !categories.includes(fact.tag)) {
                categories.push(fact.tag);
            }
        }

        ctx.response.body = {
            attachments: [{
                fallback: 'Meow!',
                image_url: 'https://loveenglish.org/wp-content/uploads/2020/11/Cat-Breeds-1.jpg'
            }],
            response_type: 'in_channel',
            text: 'The available CATegories are: ' + categories.join(', ')
        };
    }
};

const factCommand = {
    command: '*',
    description: 'Get a cat fact',
    handler: ctx => {
        let imageUrl = '';
        let fact = '';
        
        let filteredFacts = FACTS;
        if (ctx.commandText) {
            filteredFacts = filteredFacts.filter(fact => fact.tag === ctx.commandText);
            if (filteredFacts.length === 0) {
                filteredFacts = FACTS;
            }
        }

        const randomFact = filteredFacts[Math.floor(Math.random() * filteredFacts.length)];

        ctx.response.body = {
            attachments: [{
                fallback: 'Meow!',
                image_url: randomFact.imageUrl + '?r=' + randomFact.id
            }],
            response_type: 'in_channel',
            text: randomFact.message
        };
    }
};

const parser = Yargs
        .scriptName('cat-facts')
        .command(aboutCommand)
        .command(categoriesCommand)
        .command(factCommand)
        .command(helpCommand);

router.get('/', async ctx => {
    ctx.body = 'Welcome to "Cat facts Over 9000!"';
});

router.post('/slack', async ctx => {
    await commandHandler(ctx, ctx.params.text || '');
});

router.get('/slack', async ctx => {
    await commandHandler(ctx, ctx.request.query.text || '');
});

async function commandHandler(ctx, commandText) {
    await new Promise((resolve) => {
        parser.parse(commandText, { response: ctx.response, commandText }, (err, argv, output) => {
            if (err) {
                console.error(err);
            }
            resolve(output);
        });
    });
}

async function start() {
    app
        .use(router.routes())
        .use(router.allowedMethods());
        
    const db = await open({
        filename: './facts.db',
        driver: Sqlite.Database,
        mode: Sqlite.OPEN_READONLY
    });
    FACTS = await db.all('SELECT * FROM facts ORDER BY id ASC', []);

    app.listen(PORT, () => console.info(`Server listening on port ${PORT}`));
}

start();
