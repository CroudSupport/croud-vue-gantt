<template>
  <div id="app">
    <gantt :calculate="false" :events="ganttData" :end-period="endPeriod" :start-period="startPeriod" @load-more="loadMore" @selected="selected" :grouping="true" :show-repeats="repeats" :status-colors="{
        complete: '#8bccba',
        active: '#6bc2e2',
        in_progress: '#fbbd08',
    }" :readOnly="false"
    :category-groupings="group">
        <template slot="context-menu" scope="scope">
            <li @click="selected(scope.selected)" class="item">
                <i class="edit icon"></i>View
            </li>
            <li @click="postpone(scope.selected)" class="item">
                <i class="calendar icon"></i>Postpone
            </li>
        </template>
    </gantt>
    <div>
        <input type="checkbox" v-model="group"/>
        <label>Group Items</label>
    </div>
    <div>
        <input type="checkbox" v-model="repeats"/>
        <label>Show Repeats</label>
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import moment from 'moment'
import Gantt from './components/Gantt'

export default {
    name: 'app',
    components: {
        Gantt,
    },

    data() {
        return {
            moment,
            initialLoad: false,
            selectedBlock: null,
            startPeriod: moment().startOf('month').startOf('week'),
            endPeriod: moment().add(1, 'months'),
            group: true,
            repeats: true,
            params: {
                from: moment().subtract(1, 'years').format('YYYY-MM-DD'),
                to: moment().subtract(1, 'years').add(1, 'months').format('YYYY-MM-DD'),
                page: 0,
            },
            ganttData: [
                {
                    title: 'Line One',
                    offset: moment().diff(moment().startOf('month').startOf('week'), 'days'),
                    duration: 4,
                    status: 'complete',
                    x: 0,
                    width: 0,
                    readOnly: true,
                    group_by: '',
                },
                {
                    title: 'A New Event',
                    offset: moment().diff(moment().startOf('month').startOf('week'), 'days') + 3,
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
                    offset: moment().diff(moment().startOf('month').startOf('week'), 'days') + 5,
                    duration: 2,
                    frequency: {
                        key: 'weekly',
                    },
                    dependencies: [], // [0, 1],
                    status: 'active',
                    x: 0,
                    width: 0,
                    group_by: 'bar',
                },
                {
                    title: 'Another Event',
                    offset: moment().diff(moment().startOf('month').startOf('week'), 'days') + 7,
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
        }
    },

    computed: {
        urlParams() {
            return {
                from: moment(this.params.from).format('YYYY-MM-DD HH:mm:ss'),
                // to: moment(this.params.to).format('YYYY-MM-DD HH:mm:ss'),
                channel_ids: [293],
                includes: ['channel'],
                days: 30,
                page: this.params.page,
            }
        },
    },

    methods: {
        loadMore() {
            this.endPeriod = moment(this.endPeriod).add(30, 'days')
            // this.params.to = moment(this.params.to).add(1, 'months').format('YYYY-MM-DD')
            this.params.page += 1
        },

        selected(block) {
            console.log(block)
            this.selectedBlock = block
        },

        postpone(block) {
            block.offset += 1
        },
    },

    mounted() {
        this.$http.get('api/event/gantt', {
            params: this.urlParams,
        }).then((response) => {
            this.ganttData = response.data.data.filter(event => !!event.channel_id).map((event) => {
                event.frequency = { key: 'once' }
                event.page = response.data.page
                return event
            })
            this.initialLoad = true
        })
    },

    created() {
        Vue.http.options.root = '//gateway.croudcontrol.dev/'
        Vue.http.headers.common.Authorization = `Bearer ${localStorage.getItem('jwt')}`
    },

    watch: {
        urlParams: {
            deep: true,
            handler() {
                if (!this.initialLoad) return
                this.$http.get('api/event/gantt', {
                    params: this.urlParams,
                }).then((response) => {
                    this.ganttData = this.ganttData.concat(response.data.data.filter(event => !!event.channel_id).map((event) => {
                        event.frequency = { key: 'once' }
                        event.page = response.data.page
                        return event
                    }))
                })
            },
        },
    },
}
</script>

<style>
#app {
  font-family: 'Lato', Verdana, Geneva, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #292929;
  margin-top: 60px;
}
</style>
