import React from 'react'
import { Record } from 'neo4j-driver'
import { Dropdown, Menu } from 'semantic-ui-react'

interface SearchPaginationProps {
    skip: number;
    limit: number;
    orderByProperties?: string[];
    orderBy?: string;
    records?: Record[];
    handleChangeOrderBy?: (event: any, selected: any) => void;
    handleChangeSort?: (event: any, selected: any) => void;
    goPrevious: (event: any) => void;
    goNext: (event: any) => void;
}

export default function SearchPagination(props: SearchPaginationProps) {
    return (
        <Menu>
            <Menu.Menu>
                {props.orderByProperties && <Menu.Item>Sort By:</Menu.Item>}
                {props.orderByProperties && <Dropdown
                    selection
                    options={props.orderByProperties?.map((value: string) => ({ value, text: value, key: value }))}
                    placeholder='Order By'
                    value={props.orderBy}
                    onChange={props.handleChangeOrderBy}
                />}
                {/* <Dropdown
                    selection
                    options={sortOptions}
                    placeholder='Sort'
                    onChange={handleChangeSort}
                /> */}
            </Menu.Menu>
            <Menu.Menu position='right'>
                <Menu.Item>
                    Page { (props.skip / props.limit) + 1}
                </Menu.Item>

                {props.skip > 1 && <Menu.Item name='Prev' onClick={props.goPrevious} />}
                {props.records?.length === props.limit && <Menu.Item name='Next' onClick={props.goNext} />}
            </Menu.Menu>
        </Menu>

    )
}