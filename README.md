# button test
Simple test of a site entrance button on a splash page. Extracted from main project with intent to create a minimal, reproducible example of a code problem I can't seem to figure out. In short, I'm trying to get a short audio clip to play on this hold-to-activate button when tapped on mobile, but it only works on the *second* tap, and I don't know why. (Code works fine on desktop.). I understand the mobile browser restriction of "no autoplay", but if I get a user gesture (i.e. the tap and hold), how do I reliably trigger the sound on the first tap?

## Usage
1. Clone this repo
`git clone git@github.com:boswen/button-test.git`

2. Install required node modules
`pnpm i`

3. Run it locally!
`pnpm run dev --host`

4. Debug!

## Notes
- Runs fine locally! ([vite will expose it here](http://localhost:5173/))
- Doesn't seem to want to behave on mobile. Try opening the site on your phone (go to http://(your computer's IP):5173 ), then click the "Activate Terminal" button.

## How to contribute
It will run the animation frames without audio on the first try. The second will play the animation *and* the sound clip. But WHY?! Why doesn't the audio play on the first try? And can we "fix" this? If you have any ideas, feel free to fork the code and submit a pull request or open up an issue with an update suggestion and I'll give it a go!

And thank you! :)