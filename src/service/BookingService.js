import bookingDao from '../dao/BookingDao.js';
import bookingsTravelersDao from '../dao/BookingsTravelersDao.js';
import flightBookingsDao from '../dao/FlightBookingsDao.js';
import connection from '../dao/Connection.js';
import HttpStatus from '../constants/HttpStatus.js';

let bookingService = {};

bookingService.getBookingById = (id) => bookingDao.getBookingById(id);

bookingService.getBookingsByUserId = (id) => bookingDao.getBookingsByUserId(id);

bookingService.deleteBookingById = async (id) => {
    const db = await connection;

    await db.beginTransaction();
    await bookingDao.findById(id, db);
    await Promise.all([ bookingsTravelersDao.delete(id, db), flightBookingsDao.delete(id, db) ]);
    await bookingDao.delete(id, db);
    return db.commit();
};

bookingService.createBooking = async (booking, flightId, travelerIds = []) => {
    const db = await connection;
    let promises = [];

    try {
        await db.beginTransaction();
        const bookingId = await bookingDao.create(booking, db);
        promises = travelerIds.map((travelerId) =>
            bookingsTravelersDao.create({ bookingId, travelerId }, db)
        );
        const promise = flightBookingsDao.create({ bookingId, flightId }, db);
        promises.push(promise);
        await Promise.all(promises);
        await db.commit();
        return { bookingId, ...booking };
    } catch (err) {
        await db.rollback();
        throw {
            status  : HttpStatus.BAD_REQUEST,
            message : 'TODO: implement more specific message. 404 Bad Request.'
        };
    }
};

export default bookingService;