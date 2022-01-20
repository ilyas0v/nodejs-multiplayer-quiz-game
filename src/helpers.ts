export const shuffleArray = (array: string[]) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

export const randomInteger = (min: number, max: number) : number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}