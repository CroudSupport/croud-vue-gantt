import Vue from 'vue'
import moment from 'moment'
import { cloneDeep } from 'lodash'
import Gantt from '.../../../src/components/Gantt'

const Constructor = Vue.extend(Gantt)
Vue.use(moment)

const vm = new Constructor({
    propsData: {
        events: [
            {
                title: 'Line One',
                offset: moment('16-07-2018').diff(moment().startOf('month').startOf('week'), 'days'),
                duration: 4,
                status: 'complete',
                x: 0,
                width: 0,
                readOnly: true,
                group_by: '',
            },
            {
                title: 'A New Event',
                offset: moment('16-07-2018').diff(moment().startOf('month').startOf('week'), 'days') + 3,
                duration: 2,
                frequency: {
                    key: 'weekly',
                },
                dependencies: [],
                status: 'in_progress',
                x: 0,
                width: 0,
                group_by: 'foo',
            },
            {
                title: 'Dependent Event',
                offset: moment('16-07-2018').diff(moment().startOf('month').startOf('week'), 'days') + 5,
                duration: 2,
                frequency: {
                    key: 'weekly',
                },
                dependencies: [],
                status: 'active',
                x: 0,
                width: 0,
                group_by: 'bar',
            },
            {
                title: 'Another Event',
                offset: moment('16-07-2018').diff(moment().startOf('month').startOf('week'), 'days') + 7,
                duration: 4,
                frequency: {
                    key: 'once',
                },
                dependencies: [2],
                status: 'active',
                x: 0,
                width: 0,
                group_by: 'bar',
            },
        ],
    },
}).$mount()

const statusColourTests = {
    'status active': {
        event: { status: 'active' },
        expectedOutput: vm.statusColors.active,
    },
    'status in_progress': {
        event: { status: 'in_progress' },
        expectedOutput: vm.statusColors.in_progress,
    },
    'status complete': {
        event: { status: 'complete' },
        expectedOutput: vm.statusColors.complete,
    },
    'status doesnt exist, provide fallback': {
        event: { status: 'blah' },
        expectedOutput: vm.statusColors.active,
    },
}

const processEventRepeatsTests = {
    daily: {
        event: { frequency: { key: 'daily' } },
        every: 1,
        period: 'days',
    },
    every_work_day: {
        event: { frequency: { key: 'every_work_day' } },
        every: 1,
        period: 'every_work_day',
    },
    weekly: {
        event: { frequency: { key: 'weekly' } },
        every: 1,
        period: 'weeks',
    },
    four_weekly: {
        event: { frequency: { key: 'four_weekly' } },
        every: 4,
        period: 'weeks',
    },
    fortnightly: {
        event: { frequency: { key: 'fortnightly' } },
        every: 2,
        period: 'weeks',
    },
    monthly: {
        event: { frequency: { key: 'monthly' } },
        every: 1,
        period: 'months',
    },
    quarterly: {
        event: { frequency: { key: 'quarterly' } },
        every: 1,
        period: 'quarters',
    },
}

const getFilteredGroupsTests = {
    'has misc group and an empty group, should return 3 groups': {
        misc: [
        { id: 1, name: 'misc event 1' },
        { id: 2, name: 'misc event 2' },
        { id: 3, name: 'misc event 3' },
        ],
        firstGroup: [
            { id: 1, name: 'first group event 1' },
            { id: 2, name: 'first group event 2' },
        ],
        secondGroup: [],
        thirdGroup: [
            { id: 1, name: 'third group event 1' },
        ],
    },
    'has an empty misc group, and an empty group, should return 2 groups': {
        misc: [],
        firstGroup: [],
        secondGroup: [
            { id: 1, name: 'second group event 1' },
            { id: 1, name: 'second group event 1' },
        ],
        thirdGroup: [
            { id: 1, name: 'third group event 1' },
        ],
    },
    'doesnt have a misc group, should return one group': {
        firstGroup: [
            { id: 1, name: 'first group event 1' },
            { id: 2, name: 'first group event 2' },
        ],
    },
    'has no groups, should return an empty array': {},
}

describe('Build up data methods/computed props for ganttData', () => {
    describe('processEventRepeats', () => {
        Object.keys(processEventRepeatsTests).forEach((test) => {
            it(test, () => {
                const testProps = processEventRepeatsTests[test]
                const addRepeatsSpy = jest.spyOn(vm, 'addRepeats')
                vm.processEventRepeats(testProps.event)

                expect(addRepeatsSpy).toHaveBeenCalledWith(testProps.event, testProps.every, testProps.period)
            })
        })
    })

    describe('processedEvents computed prop', () => {
        it('it sets the label field', () => {
            const output = vm.processedEvents
            Vue.nextTick(() => {
                output.forEach((event) => {
                    expect(event.label.length).not.toBe(0)
                })
            })
        })

        it('it doesnt sets the event children if showRepeats prop is false', () => {
            vm.showRepeats = false
            const output = vm.processedEvents
            Vue.nextTick(() => {
                output.forEach((event) => {
                    expect(event.children.length).toBe(0)
                })
            })
        })

        it('it sets the event children if showRepeats is true, and the frequency key is not once', () => {
            vm.showRepeats = true
            const output = vm.processedEvents
            Vue.nextTick(() => {
                output.forEach((event) => {
                    if (event.frequency && event.frequency.key && event.frequency.key !== 'once') {
                        expect(event.children.length).not.toBe(0)
                    } else {
                        expect(event.children.length).toBe(0)
                    }
                })
            })
        })
    })

    describe('getItemLinks', () => {
        it('gets linked events', () => {
            const links = { misc: [] }
            vm.processedEvents.forEach((event) => {
                vm.getItemLinks(event.group_by, event, links)
            })
            Vue.nextTick(() => {
                expect(links).toMatchSnapshot()
            })
        })
    })

    describe('getStatusColour', () => {
        Object.keys(statusColourTests).forEach((test) => {
            it(test, () => {
                const result = vm.getStatusColour(statusColourTests[test].event)
                expect(result).toBe(statusColourTests[test].expectedOutput)
            })
        })
    })

    describe('position', () => {
        it('sets the position data on an event', () => {
            const result = vm.position(vm.events[0])

            expect(result).toMatchSnapshot()
        })
    })

    describe('getChildPositions', () => {
        it('sets the event_index and calls the position method for each child event', () => {
            const checkPositionCalled = jest.spyOn(vm, 'position')

            const index = 5
            const result = vm.getChildPositions(vm.processedEvents[1], index)

            expect(result).toMatchSnapshot()
            expect(result.children[0].event_index).toBe(5)

            expect(checkPositionCalled).toHaveBeenCalledTimes(result.children.length)
            expect(checkPositionCalled).toHaveBeenCalledWith(result.children[0])
        })
    })

    describe('getFilteredGroups', () => {
        Object.keys(getFilteredGroupsTests).forEach((test) => {
            it(test, () => {
                const filteredGroups = vm.getFilteredGroups(getFilteredGroupsTests[test])
                expect(filteredGroups).toMatchSnapshot()
            })
        })
    })

    describe('processGroupedData', () => {
        it('provides all events in a misc group if categoryGroupings is false (default)', () => {
            const titleGroupings = cloneDeep(vm.defaultObject)
            const links = cloneDeep(vm.defaultObject)

            const result = vm.processGroupedData(titleGroupings, links)
            Vue.nextTick(() => {
                expect(result).toMatchSnapshot()
            })
        })

        it('provides events in groups defined by the events group_by or the fallback category', () => {
            vm.categoryGroupings = true
            const titleGroupings = cloneDeep(vm.defaultObject)
            const links = cloneDeep(vm.defaultObject)

            const result = vm.processGroupedData(titleGroupings, links)
            Vue.nextTick(() => {
                expect(result).toMatchSnapshot()
            })
        })

        it('provides events in groups defined by the events group_by field', () => {
            vm.categoryGroupings = true
            const titleGroupings = cloneDeep(vm.defaultObject)
            const links = cloneDeep(vm.defaultObject)

            const result = vm.processGroupedData(titleGroupings, links)
            Vue.nextTick(() => {
                expect(result).toMatchSnapshot()
            })
        })

        it('provides events in groups defined by categoryGroupings prop, if an event group doesnt exist, events are placed in the fallback category', () => {
            vm.categoryGroupings = { foo: [] }
            const titleGroupings = cloneDeep(vm.defaultObject)
            const links = cloneDeep(vm.defaultObject)

            const result = vm.processGroupedData(titleGroupings, links)
            Vue.nextTick(() => {
                expect(result).toMatchSnapshot()
            })
        })
    })

    describe('buildGanttData', () => {
        it('maps data ready for rendering on the gantt', () => {
            vm.categoryGroupings = true
            vm.buildGanttData()
            Vue.nextTick(() => {
                expect(vm.ganttData).toMatchSnapshot()
            })
        })
    })
})
