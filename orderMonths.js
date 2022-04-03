module.exports.orderMonths = (monthsAndRent) => {
    const months = monthsAndRent[0];
    const avgRent = monthsAndRent[1];
    const monthsInOrder = [];
    const avgRentInOrder = [];

    let janIndex = months.findIndex(object => {
        return object == 'Jan';
    });
    console.log(janIndex);
    if (janIndex != -1) {
        monthsInOrder.push('Jan');
        avgRentInOrder.push(avgRent[janIndex]);
    }

    let febIndex = months.findIndex(object => {
        return object == 'Feb';
    });
    if (febIndex != -1) {
        monthsInOrder.push('Feb');
        avgRentInOrder.push(avgRent[febIndex]);
    }

    let marIndex = months.findIndex(object => {
        return object == 'Mar';
    });
    if (marIndex != -1) {
        monthsInOrder.push('Mar');
        avgRentInOrder.push(avgRent[marIndex]);
    }

    let aprIndex = months.findIndex(object => {
        return object == 'Apr';
    });
    if (aprIndex != -1) {
        monthsInOrder.push('Apr');
        avgRentInOrder.push(avgRent[aprIndex]);
    }

    let mayIndex = months.findIndex(object => {
        return object == 'May';
    });
    if (mayIndex != -1) {
        monthsInOrder.push('May');
        avgRentInOrder.push(avgRent[mayIndex]);
    }

    let junIndex = months.findIndex(object => {
        return object == 'Jun';
    });
    if (junIndex != -1) {
        monthsInOrder.push('Jun');
        avgRentInOrder.push(avgRent[junIndex]);
    }

    let julIndex = months.findIndex(object => {
        return object == 'Jul';
    });
    if (julIndex != -1) {
        monthsInOrder.push('Jul');
        avgRentInOrder.push(avgRent[julIndex]);
    }

    let augIndex = months.findIndex(object => {
        return object == 'Aug';
    });
    if (augIndex != -1) {
        monthsInOrder.push('Aug');
        avgRentInOrder.push(avgRent[augIndex]);
    }

    let sepIndex = months.findIndex(object => {
        return object == 'Sep';
    });
    if (sepIndex != -1) {
        monthsInOrder.push('Sep');
        avgRentInOrder.push(avgRent[sepIndex]);
    }

    let octIndex = months.findIndex(object => {
        return object == 'Oct';
    });
    if (octIndex != -1) {
        monthsInOrder.push('Oct');
        avgRentInOrder.push(avgRent[octIndex]);
    }

    let novIndex = months.findIndex(object => {
        return object == 'Nov';
    });
    if (novIndex != -1) {
        monthsInOrder.push('Nov');
        avgRentInOrder.push(avgRent[novIndex]);
    }

    let decIndex = months.findIndex(object => {
        return object == 'Dec';
    });
    if (decIndex != -1) {
        monthsInOrder.push('Dec');
        avgRentInOrder.push(avgRent[decIndex]);
    }

    return [monthsInOrder, avgRentInOrder]; 
}