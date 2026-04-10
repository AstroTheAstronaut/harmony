const Schedule = require('../../models/Schedule');

async function getScheduleById(scheduleId) {
    try {
        const schedule = await Schedule.findOne({ schedule_uid: scheduleId });
        if (!schedule) {
            throw new Error('Schedule not found');
        }

        const originalLength = Array.isArray(schedule.content) ? schedule.content.length : 0;
        schedule.content = (schedule.content || []).filter(item => item && typeof item === 'object' && item.type);

        if (schedule.content.length !== originalLength) {
            await schedule.save();
        }

        return schedule;
    } catch (err) {
        console.error('Error in getScheduleById:', err);
        throw new Error('Failed to retrieve schedule by ID');
    }
}

async function addContentToSchedule(scheduleId, content) {
    try {
        const schedule = await Schedule.findOne({ schedule_uid: scheduleId });
        if (!schedule) {
            throw new Error('Schedule not found');
        }

        if (!content || typeof content !== 'object') {
            console.error('Invalid content provided to addContentToSchedule');
            console.error('Content:', content);
            throw new Error('Content is required');
        }

        const lastItem = schedule.content.at(-1)
        let nextPosition = lastItem ? lastItem.position + 1 : 1;
        if (lastItem) {
            const lastPosition = lastItem.position;
            nextPosition = lastPosition + 1;
        }

        let payload = {
            ...content,
            position: nextPosition
        };

        schedule.content.push(payload);
        await schedule.save();
        return schedule;
    } catch (err) {
        console.error('Error in addContentToSchedule:', err);
        throw new Error('Failed to add content to schedule');
    }
}

async function removeContentFromSchedule (scheduleId, position) {
    try {
        const schedule = await Schedule.findOne({schedule_uid: scheduleId});
        if (!schedule) {
            throw new Error ("Cannot find schedule!");
        }
        const targetPosition = parseInt(position, 10);

        schedule.content = schedule.content.filter(item => item.position !== targetPosition);

        schedule.content.forEach((item, index) => {
            item.position = index + 1;
        });

        await schedule.save()
        return schedule;
    } catch (error) {
        console.error("Error in removeContentFromSchedule: ", error);
        throw new Error("Failed to remove content from schedule!");
    }
}

// async function reorderContentFromSchedule (scheduleId, newOrder) {
//     try {
//         const schedule = await Schedule.findOne({schedule_uid: scheduleId});
//         if (!schedule) {
//             throw new Error ("Cannot find schedule!");
//         }
//         const updatedContent = newOrder.map((oldPos, index) => {
//             // Find the item that used to be at that position
//             const item = schedule.content.find(c => c.position == oldPos);
//             if (item) {
//                 // Assign it the NEW position (index + 1)
//                 item.position = index + 1;
//                 return item;
//             }
//         }).filter(Boolean); // Remove any nulls if an item wasn't found

//         schedule.content = updatedContent;
//         await schedule.save();
//     } catch (err) {
//         console.error("Error in reorderContentFromSchedule: ", err);
//         throw new Error ("Failed to reorder the content from the schedule!")
//     }
// }

async function reorderContentFromSchedule(scheduleId, newOrder) {
    const schedule = await Schedule.findOne({ schedule_uid: scheduleId });
    if (!schedule) throw new Error('Schedule not found');

    // 1. Gather items in the NEW order WITHOUT modifying their positions yet
    const reorderedItems = newOrder.map(oldPos => {
        // Find the original item based on its old position
        return schedule.content.find(c => c.position == oldPos);
    }).filter(Boolean); // Filter out any nulls just in case

    // 2. NOW it is safe to update the positions sequentially
    reorderedItems.forEach((item, index) => {
        item.position = index + 1;
    });

    // 3. Save the clean array back to the database
    schedule.content = reorderedItems;
    await schedule.save();
    
    return schedule;
}

async function editScheduleDetails(scheduleId, details) {
    try {
        const schedule = await Schedule.findOne({ schedule_uid: scheduleId });
        if (!schedule) throw new Error('Schedule not found');

        if (!details || typeof content !== 'object') {
            console.error('Invalid content provided to addContentToSchedule');
            console.error('Content:', content);
            throw new Error('Content is required');
        }
    } catch (error) {
        console.error("Error in changeScheduleDetaisl (services.js)");
        throw new Error("Failed to change schedule details (/routes/schedule-view/services.js/changeScheduleDetails)");
    }
}

module.exports = {
    getScheduleById,
    addContentToSchedule,
    removeContentFromSchedule,
    reorderContentFromSchedule,
    editScheduleDetails
};